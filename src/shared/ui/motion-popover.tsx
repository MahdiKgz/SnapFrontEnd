import type { ComponentProps } from "react";

import { Popover } from "@base-ui/react/popover";
import { motion, useReducedMotion } from "framer-motion";

type PopupProps = Omit<ComponentProps<typeof Popover.Popup>, "render">;

export function MotionPopoverPopup(props: PopupProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Popover.Popup
      {...props}
      render={
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      }
    />
  );
}
