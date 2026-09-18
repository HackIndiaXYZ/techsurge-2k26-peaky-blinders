You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
image-auto-slider.tsx

import React from 'react';

export const Component = () => {
  // Images for the infinite scroll - using Unsplash URLs
  const images = [
    "https://cdn.21st.dev/assets/mirror/0b/0b2eee3635f20ec932fa27ae8db24eb760045aee6dd53c6cd05b01799761b6fb.jpg",
    "https://cdn.21st.dev/assets/mirror/a0/a0e1a6affa10f9d1304e1ec7a0a074efa2e5befddbe5f55ec1674ca4606a7272.jpg",
    "https://cdn.21st.dev/assets/mirror/c5/c50a953b2534eeb024de5eb84901abda556e6a8faa74bb6c13983557f14f02e2.jpg",
    "https://cdn.21st.dev/assets/mirror/2c/2c3bda48c0009be1f143cfed1b28a012de388bcd39d662df550ec1d28966b864.jpg",
    "https://cdn.21st.dev/assets/mirror/df/df5b37ca7d83d93ddbece6430932d006f89d70704f4cf14c91bc724b9653ec9f.jpg",
    "https://cdn.21st.dev/assets/mirror/fe/fe0e5e4058e6fc722507077aa70c1e0fd48ee254ab0bae5512902dc6729ff155.jpg",
    "https://cdn.21st.dev/assets/mirror/6f/6ff6818c9f0e9b6b28eb7f16f650538626b00cf3b10c36eac6840d280c799636.jpg",
    "https://cdn.21st.dev/assets/mirror/97/971ee8523c7efc71ed5323f0b7c386b7b09dde6af9bae9bedd7288ca7a787b40.jpg"
  ];

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className="w-full min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-0" />
        
        {/* Scrolling images container */}
        <div className="relative z-10 w-full flex items-center justify-center py-8">
          <div className="scroll-container w-full max-w-6xl">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={index}
                  className="image-item flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={image}
                    alt={`Gallery image ${(index % images.length) + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-20" />
      </div>
    </>
  );
};


demo.tsx
// This is file with demos of your component
// Each export is one usecase for your component

import { Component } from "@/components/ui/image-auto-slider";

const DemoOne = () => {
  return <Component />;
};

export { DemoOne };

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
