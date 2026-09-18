"use client";

import Image from "next/image";
import pausePayLogo from "@/assets/logo.png";

function AppLogo({ id }: { id: string }) {
  if (id === "phonepe") {
    return <svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="256" fill="#5f259f"/><path d="M372.164 189.203c0-10.008-8.576-18.593-18.584-18.593h-34.323l-78.638-90.084c-7.154-8.577-18.592-11.439-30.03-8.577l-27.17 8.577c-4.292 1.43-5.723 7.154-2.862 10.007l85.8 81.508H136.236c-4.293 0-7.154 2.861-7.154 7.154v14.292c0 10.016 8.585 18.592 18.592 18.592h20.015v68.639c0 51.476 27.17 81.499 72.931 81.499 14.292 0 25.739-1.431 40.03-7.146v45.753c0 12.87 10.016 22.886 22.885 22.886h20.015c4.293 0 8.577-4.293 8.577-8.586V210.648h32.893c4.292 0 7.145-2.861 7.145-7.145v-14.3zM280.65 312.17c-8.576 4.292-20.015 5.723-28.591 5.723-22.886 0-34.324-11.438-34.324-37.176v-68.639h62.915v100.092z" fill="#fff"/></svg>;
  }

  if (id === "gpay") {
    return <svg viewBox="108 108 180 184" aria-hidden="true"><path d="M282.23 202c0-6.26-.56-12.25-1.6-18.01h-80.48v33l46.35.01c-1.88 10.98-7.93 20.34-17.2 26.58v21.41h27.59c16.11-14.91 25.34-36.95 25.34-62.99z" fill="#4285f4"/><path d="M229.31 243.58c-7.68 5.18-17.57 8.21-29.14 8.21-22.35 0-41.31-15.06-48.1-35.36h-28.46v22.08c14.1 27.98 43.08 47.18 76.56 47.18 23.14 0 42.58-7.61 56.73-20.71l-27.59-21.4z" fill="#34a853"/><path d="M149.39 200.05c0-5.7.95-11.21 2.68-16.39v-22.08h-28.46c-5.83 11.57-9.11 24.63-9.11 38.47s3.29 26.9 9.11 38.47l28.46-22.08a51.657 51.657 0 01-2.68-16.39z" fill="#fabb05"/><path d="M200.17 148.3c12.63 0 23.94 4.35 32.87 12.85l24.45-24.43c-14.85-13.83-34.21-22.32-57.32-22.32-33.47 0-62.46 19.2-76.56 47.18l28.46 22.08c6.79-20.3 25.75-35.36 48.1-35.36z" fill="#e94235"/></svg>;
  }

  if (id === "whatsapp") {
    return <svg viewBox="0 0 240 241.19" aria-hidden="true"><path fill="#25d366" fillRule="evenodd" d="M205 35.05A118.61 118.61 0 00120.46 0C54.6 0 1 53.61 1 119.51a119.5 119.5 0 0016 59.74L0 241.19l63.36-16.63a119.43 119.43 0 0057.08 14.57A119.54 119.54 0 00205 35.07v-.02zM120.5 219a99.18 99.18 0 01-50.59-13.9l-3.64-2.17-37.6 9.85 10-36.65-2.35-3.76A99.37 99.37 0 11120.49 219zM175 144.54c-3-1.51-17.67-8.71-20.39-9.71s-4.72-1.51-6.75 1.51-7.72 9.71-9.46 11.72-3.49 2.27-6.45.76-12.63-4.66-24-14.84a91.1 91.1 0 01-16.7-20.68c-1.75-3-.19-4.61 1.33-6.07s3-3.48 4.47-5.23a19.65 19.65 0 003-5 5.51 5.51 0 00-.24-5.23C99 90.27 93 75.57 90.6 69.58s-4.89-5-6.73-5.14-3.73-.09-5.7-.09a11 11 0 00-8 3.73C67.48 71.05 59.75 78.3 59.75 93s10.69 28.88 12.19 30.9S93 156.07 123 169c7.12 3.06 12.68 4.9 17 6.32a41.18 41.18 0 0018.8 1.17c5.74-.84 17.66-7.21 20.17-14.18s2.5-13 1.75-14.19-2.69-2.06-5.7-3.59z"/></svg>;
  }

  if (id === "amazon") {
    return <svg viewBox="0 0 512 512" aria-hidden="true"><path d="M451.143 350.263c-52.618 38.832-128.896 59.48-194.587 59.48-92.064 0-174.966-34.034-237.695-90.676-4.925-4.45-.538-10.524 5.387-7.075 67.679 39.383 151.38 63.105 237.832 63.105 58.317 0 122.422-12.099 181.414-37.12 8.887-3.787 16.348 5.849 7.65 12.286m21.884-24.997c6.737 8.624-7.487 44.132-13.836 59.992-1.924 4.8 2.2 6.737 6.55 3.1 28.22-23.61 35.52-73.091 29.746-80.24-5.737-7.087-55.08-13.186-85.202 7.961-4.637 3.25-3.837 7.75 1.3 7.125 16.96-2.025 54.718-6.562 61.442 2.062" fill="#f90"/><path d="M112 138h62v178h-31v-58h-31v58H82V172c0-19 11-34 30-34zm0 30v60h31v-60h-31zm91-30h31v18c12-14 28-21 48-21 38 0 61 31 61 88 0 61-25 94-68 94-16 0-30-5-41-16v61h-31V138zm68 27c-14 0-26 5-37 14v91c11 10 23 15 36 15 27 0 40-20 40-61 0-39-13-59-39-59z" fill="#232f3e"/></svg>;
  }

  if (id === "paytm") {
    return <svg viewBox="0 0 122.88 38.52" aria-hidden="true"><text x="0" y="29" fontFamily="Arial, sans-serif" fontSize="34" fontWeight="700" fill="#20336b">pay</text><text x="56" y="29" fontFamily="Arial, sans-serif" fontSize="34" fontWeight="700" fill="#00baf2">tm</text></svg>;
  }

  return <svg viewBox="0 0 122.88 35.24" aria-hidden="true"><path fill="#f07a25" d="M111.45 19.26l-5.17 4.81-.17-.13 6.29-22.92c.08-.77.54-.96.86-.12l5.16 10.34c.31.63.18 1.22-.36 1.7l-6.61 6.32z"/><path fill="#0c8d48" d="M111.45 19.26l6.61-6.32c.54-.48.67-1.07.36-1.7l-2.92-6.06L117.04.01l5.57 10.98c.49.88.34 1.51-.43 2.12l-11.76 10.95 1.03-4.8z"/><text x="0" y="23" fontFamily="Arial, sans-serif" fontSize="23" fontWeight="800" fill="#66686c">BHIM</text></svg>;
}

const apps = [
  { id: "gpay", name: "Google Pay", tone: "#4285f4", x: 96, y: 72, path: "M 260 196 V 92 Q 260 72 240 72 H 96" },
  { id: "phonepe", name: "PhonePe", tone: "#5f259f", x: 448, y: 72, path: "M 284 196 V 92 Q 284 72 304 72 H 448" },
  { id: "paytm", name: "Paytm", tone: "#00baf2", x: 88, y: 205, path: "M 240 205 H 88" },
  { id: "bhim", name: "BHIM", tone: "#159467", x: 456, y: 205, path: "M 304 205 H 456" },
  { id: "amazon", name: "Amazon Pay", tone: "#ff9900", x: 112, y: 342, path: "M 260 220 V 322 Q 260 342 240 342 H 112" },
  { id: "whatsapp", name: "WhatsApp", tone: "#25d366", x: 432, y: 342, path: "M 284 220 V 322 Q 284 342 304 342 H 432" },
];

export function UPINetwork() {
  return (
    <figure className="upi-network" aria-labelledby="upi-network-title">
      <figcaption className="upi-network__caption">
        <span>Works across UPI</span>
        <span>One safety layer</span>
      </figcaption>

      <svg className="upi-network__lines" viewBox="0 0 544 410" aria-hidden="true">
        <defs>
          <linearGradient id="signal" x1="0" x2="1">
            <stop offset="0" stopColor="transparent" />
            <stop offset="0.5" stopColor="currentColor" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
        {apps.map((app, index) => (
          <g key={app.id}>
            <path d={app.path} className="upi-network__rail" />
            <path
              d={app.path}
              className="upi-network__signal"
              style={{ animationDelay: `${index * -0.55}s` }}
            />
          </g>
        ))}
      </svg>

      <div className="upi-network__core">
        <span className="upi-network__pulse" aria-hidden="true" />
        <span className="upi-network__brand-mark">
          <Image src={pausePayLogo} alt="" width={34} height={34} priority />
        </span>
        <strong id="upi-network-title">PausePay</strong>
        <small>Checks before you pay</small>
      </div>

      {apps.map((app) => (
        <div
          className="upi-app"
          key={app.id}
          style={{ left: `${(app.x / 544) * 100}%`, top: `${(app.y / 410) * 100}%`, "--app-color": app.tone } as React.CSSProperties}
        >
          <span className={`upi-app__mark upi-app__mark--${app.id}`} aria-hidden="true"><AppLogo id={app.id} /></span>
          <span>{app.name}</span>
        </div>
      ))}

      <p className="upi-network__more">Also supports any UPI app</p>
    </figure>
  );
}
