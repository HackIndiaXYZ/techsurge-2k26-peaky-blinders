import os

target_path = r"c:\Users\prana\Projects\techsurge\techsurge-2k26-peaky-blinders\frontend\components\dashboard\CompanyDashboard.tsx"

with open(target_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace text-foreground on root container (and anywhere else it's used standalone)
content = content.replace("text-foreground", "text-white/90")

# Replace text-muted-foreground with text-white/50
content = content.replace("text-muted-foreground", "text-white/50")

with open(target_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced text colors successfully.")
