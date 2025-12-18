'use client';

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  SonicWidget,
  type SonicWidgetConfig,
} from './SonicWidget';

export interface InitSonicWidgetConfig extends SonicWidgetConfig {
  /**
   * Target container where the widget trigger button will be rendered.
   * Can be a CSS selector or an HTMLElement.
   */
  target: string | HTMLElement;
}

export interface SonicWidgetInstance {
  destroy: () => void;
}

export function initSonicWidget(config: InitSonicWidgetConfig): SonicWidgetInstance {
  const { target, ...widgetConfig } = config;

  const element =
    typeof target === 'string'
      ? (document.querySelector(target) as HTMLElement | null)
      : target;

  if (!element) {
    throw new Error(
      `initSonicWidget: target "${String(target)}" not found in the document.`,
    );
  }

  let root: Root;

  if ((element as any)._sonicWidgetRoot) {
    root = (element as any)._sonicWidgetRoot as Root;
  } else {
    root = createRoot(element);
    (element as any)._sonicWidgetRoot = root;
  }

  root.render(<SonicWidget {...widgetConfig} />);

  return {
    destroy: () => {
      root.unmount();
      if ((element as any)._sonicWidgetRoot) {
        delete (element as any)._sonicWidgetRoot;
      }
    },
  };
}


