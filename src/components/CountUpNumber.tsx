import { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'framer-motion';

interface CountUpNumberProps {
  value: number;
}

export function CountUpNumber({ value }: CountUpNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return <span>{displayValue}</span>;
}
