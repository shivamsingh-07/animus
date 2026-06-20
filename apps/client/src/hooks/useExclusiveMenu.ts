import { useState } from 'react';

type PlayerMenu = 'speed' | 'tracks' | 'quality';

export function useExclusiveMenu() {
  const [activeMenu, setActiveMenu] = useState<PlayerMenu | null>(null);

  const toggleMenu = (menu: PlayerMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeMenu = () => setActiveMenu(null);

  return { activeMenu, toggleMenu, closeMenu };
}
