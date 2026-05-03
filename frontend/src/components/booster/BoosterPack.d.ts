import type { ReactElement } from 'react';

interface BoosterPackProps {
  userId?: string | null;
}

declare const BoosterPack: (props?: BoosterPackProps) => ReactElement;
export default BoosterPack;