"use client";

import { useEffect } from "react";

export default function DraggableDevIndicator() {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== "development") return;

    const makeDraggable = () => {
      // Find the Next.js portal which contains the dev indicator
      const portal = document.querySelector("nextjs-portal");
      if (!portal || !portal.shadowRoot) return;

      const shadow = portal.shadowRoot;
      
      // Find the indicator container inside the shadow DOM
      const children = Array.from(shadow.children) as HTMLElement[];
      const indicator = children.find(el => {
        const style = window.getComputedStyle(el);
        // The dev indicator is a fixed element. We avoid error overlays (which usually take up the whole screen)
        return (style.position === 'fixed' || style.position === 'absolute') && 
               el.tagName === 'DIV' && 
               parseInt(style.width || "0") < 200; 
      });

      if (!indicator) return;
      if (indicator.dataset.isDraggable) return; // Prevent multiple bindings
      indicator.dataset.isDraggable = "true";

      // Apply dragging styles
      indicator.style.cursor = "move";
      indicator.style.userSelect = "none";
      indicator.style.transition = "none"; // Disable CSS transitions for smooth dragging
      
      // Capture the initial position to start dragging from there
      const rect = indicator.getBoundingClientRect();
      indicator.style.bottom = "auto";
      indicator.style.right = "auto";
      indicator.style.left = `${rect.left}px`;
      indicator.style.top = `${rect.top}px`;

      let isDragging = false;
      let startX = 0, startY = 0, currentX = rect.left, currentY = rect.top;

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
        indicator.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling on mobile while dragging
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        indicator.style.left = `${currentX}px`;
        indicator.style.top = `${currentY}px`;
        indicator.style.transform = 'none'; 
      };

      const onPointerUp = (e: PointerEvent) => {
        isDragging = false;
        indicator.releasePointerCapture(e.pointerId);
      };

      // Add touch/mouse event listeners
      indicator.addEventListener("pointerdown", onPointerDown);
      indicator.addEventListener("pointermove", onPointerMove);
      indicator.addEventListener("pointerup", onPointerUp);
      indicator.addEventListener("pointercancel", onPointerUp);
    };

    // Run periodically to catch the indicator if Next.js hot reloads it
    const interval = setInterval(makeDraggable, 1500);
    return () => clearInterval(interval);
  }, []);

  return null;
}
