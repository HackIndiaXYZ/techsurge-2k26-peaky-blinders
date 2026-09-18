"""Train the PausePay message classifiers.

Usage:
    python scripts/train_model.py [--data data/payment_messages.csv] [--out models_store/intent_model.joblib]

Two scikit-learn pipelines are trained on the same TF-IDF features
(word uni/bi-grams + character 3-5-grams):

  * intent model  — multi-class LogisticRegression over the 15 intent labels
  * fraud model   — binary LogisticRegression over `is_fraud`

Both are evaluated on a stratified 80/20 hold-out split. All metrics printed
and saved to data/model_metrics.json are computed from that split; nothing is
typed in by hand.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services.text_normaliser import normalise_text  # noqa: E402

MODEL_VERSION = "tfidf-logreg-1.0"


def build_pipeline(multi_class: bool) -> Pipeline:
    features = FeatureUnion(
        [
            ("word", TfidfVectorizer(preprocessor=normalise_text, ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
            ("char", TfidfVectorizer(preprocessor=normalise_text, analyzer="char_wb", ngram_range=(3, 5), min_df=3, sublinear_tf=True)),
        ]
    )
    clf = LogisticRegression(C=4.0, max_iter=2000, class_weight="balanced")
    return Pipeline([("features", features), ("clf", clf)])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=BACKEND_DIR / "data" / "payment_messages.csv")
    parser.add_argument("--out", type=Path, default=BACKEND_DIR / "models_store" / "intent_model.joblib")
    parser.add_argument("--metrics", type=Path, default=BACKEND_DIR / "data" / "model_metrics.json")
    parser.add_argument("--holdout", type=Path, default=BACKEND_DIR / "data" / "holdout_messages.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    df["is_fraud"] = df["is_fraud"].astype(str).str.lower().eq("true")
    X = df["message"].astype(str)
    y_intent = df["intent"].astype(str)
    y_fraud = df["is_fraud"].astype(int)

    X_train, X_test, yi_train, yi_test, yf_train, yf_test = train_test_split(
        X, y_intent, y_fraud, test_size=0.2, random_state=args.seed, stratify=y_intent
    )

    # --- intent model --------------------------------------------------------
    t0 = time.perf_counter()
    intent_model = build_pipeline(multi_class=True).fit(X_train, yi_train)
    intent_train_s = time.perf_counter() - t0
    yi_pred = intent_model.predict(X_test)
    labels = sorted(y_intent.unique())
    intent_metrics = {
        "accuracy": float(accuracy_score(yi_test, yi_pred)),
        "precision_macro": float(precision_score(yi_test, yi_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(yi_test, yi_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(yi_test, yi_pred, average="macro", zero_division=0)),
        "f1_weighted": float(f1_score(yi_test, yi_pred, average="weighted", zero_division=0)),
        "labels": labels,
        "confusion_matrix": confusion_matrix(yi_test, yi_pred, labels=labels).tolist(),
        "per_class": classification_report(yi_test, yi_pred, labels=labels, output_dict=True, zero_division=0),
    }

    # --- fraud model ---------------------------------------------------------
    fraud_model = build_pipeline(multi_class=False).fit(X_train, yf_train)
    yf_prob = fraud_model.predict_proba(X_test)[:, 1]
    yf_pred = (yf_prob >= 0.5).astype(int)
    fraud_metrics = {
        "accuracy": float(accuracy_score(yf_test, yf_pred)),
        "precision": float(precision_score(yf_test, yf_pred, zero_division=0)),
        "recall": float(recall_score(yf_test, yf_pred, zero_division=0)),
        "f1": float(f1_score(yf_test, yf_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(yf_test, yf_prob)),
        "confusion_matrix": confusion_matrix(yf_test, yf_pred, labels=[0, 1]).tolist(),
        "false_positive_rate": float(((yf_pred == 1) & (yf_test.values == 0)).sum() / max(1, (yf_test.values == 0).sum())),
        "false_negative_rate": float(((yf_pred == 0) & (yf_test.values == 1)).sum() / max(1, (yf_test.values == 1).sum())),
    }

    # --- hand-written holdout ------------------------------------------------
    # The templated test split is easy by construction. The holdout file holds
    # free-form messages that were never generated from templates; it is the
    # more honest indicator of how the model behaves on unseen phrasing.
    holdout_metrics = None
    if args.holdout.exists():
        hold = pd.read_csv(args.holdout)
        hold["is_fraud"] = hold["is_fraud"].astype(str).str.lower().eq("true")
        hi_pred = intent_model.predict(hold["message"].astype(str))
        hf_prob = fraud_model.predict_proba(hold["message"].astype(str))[:, 1]
        hf_pred = (hf_prob >= 0.5).astype(int)
        hf_true = hold["is_fraud"].astype(int).values
        payment_true = (hold["intent"] != "NON_PAYMENT").astype(int).values
        payment_pred = (pd.Series(hi_pred) != "NON_PAYMENT").astype(int).values
        holdout_metrics = {
            "rows": int(len(hold)),
            "intent_accuracy": float(accuracy_score(hold["intent"], hi_pred)),
            "intent_f1_macro": float(f1_score(hold["intent"], hi_pred, average="macro", zero_division=0)),
            "payment_related_accuracy": float(accuracy_score(payment_true, payment_pred)),
            "fraud_accuracy": float(accuracy_score(hf_true, hf_pred)),
            "fraud_precision": float(precision_score(hf_true, hf_pred, zero_division=0)),
            "fraud_recall": float(recall_score(hf_true, hf_pred, zero_division=0)),
            "fraud_f1": float(f1_score(hf_true, hf_pred, zero_division=0)),
            "fraud_confusion_matrix": confusion_matrix(hf_true, hf_pred, labels=[0, 1]).tolist(),
            "misclassified": [
                {"message": m, "true": t, "predicted": p}
                for m, t, p in zip(hold["message"], hold["intent"], hi_pred)
                if t != p
            ],
        }

    # --- inference latency ---------------------------------------------------
    sample = X_test.iloc[:200].tolist()
    t0 = time.perf_counter()
    for text in sample:
        intent_model.predict_proba([text])
        fraud_model.predict_proba([text])
    latency_ms = (time.perf_counter() - t0) / len(sample) * 1000

    metrics = {
        "model_version": MODEL_VERSION,
        "trained_at": pd.Timestamp.now("UTC").isoformat(),
        "dataset": {"path": str(args.data.name), "rows": int(len(df)), "train_rows": int(len(X_train)), "test_rows": int(len(X_test)), "fraud_share": float(y_fraud.mean())},
        "intent": intent_metrics,
        "fraud": fraud_metrics,
        "holdout": holdout_metrics,
        "avg_inference_latency_ms": float(latency_ms),
        "intent_train_seconds": float(intent_train_s),
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"version": MODEL_VERSION, "intent_model": intent_model, "fraud_model": fraud_model, "labels": labels}, args.out)
    args.metrics.parent.mkdir(parents=True, exist_ok=True)
    args.metrics.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(f"dataset rows: {len(df)}  train: {len(X_train)}  test: {len(X_test)}")
    print(f"intent  accuracy={intent_metrics['accuracy']:.4f} precision(macro)={intent_metrics['precision_macro']:.4f} recall(macro)={intent_metrics['recall_macro']:.4f} f1(macro)={intent_metrics['f1_macro']:.4f}")
    print(f"fraud   accuracy={fraud_metrics['accuracy']:.4f} precision={fraud_metrics['precision']:.4f} recall={fraud_metrics['recall']:.4f} f1={fraud_metrics['f1']:.4f} auc={fraud_metrics['roc_auc']:.4f}")
    print(f"avg inference latency: {latency_ms:.2f} ms (both models)")
    if holdout_metrics:
        print(
            f"holdout ({holdout_metrics['rows']} hand-written msgs)  intent acc={holdout_metrics['intent_accuracy']:.4f} "
            f"payment-related acc={holdout_metrics['payment_related_accuracy']:.4f}  "
            f"fraud acc={holdout_metrics['fraud_accuracy']:.4f} precision={holdout_metrics['fraud_precision']:.4f} recall={holdout_metrics['fraud_recall']:.4f} f1={holdout_metrics['fraud_f1']:.4f}"
        )
        for miss in holdout_metrics["misclassified"]:
            print(f"   miss: [{miss['true']} -> {miss['predicted']}] {miss['message'][:90]}")
    print("\nintent confusion matrix (rows=true, cols=pred):")
    width = max(len(l) for l in labels)
    print(" " * (width + 2) + " ".join(f"{l[:4]:>4}" for l in labels))
    for label, row in zip(labels, intent_metrics["confusion_matrix"]):
        print(f"{label:<{width}}  " + " ".join(f"{v:>4}" for v in row))
    print(f"\nsaved model -> {args.out}\nsaved metrics -> {args.metrics}")


if __name__ == "__main__":
    main()
