"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import darkLogo from "../../assets/darkmode.png";
import lightLogo from "../../assets/lightmode.png";

export function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logo = mounted && resolvedTheme === "dark" ? darkLogo : lightLogo;

  return (
    <Image
      className="brand__logo"
      src={logo}
      alt="Authorised to Lose"
      priority
    />
  );
}