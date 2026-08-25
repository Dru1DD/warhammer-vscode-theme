import { Button } from './Button';
import { useState } from 'react';

export const App = () => {
  const [count, setCount] = useState(0);
  return <div><Button label={String(count)} /></div>;
};

export const NOT_A_COMPONENT = 42;
