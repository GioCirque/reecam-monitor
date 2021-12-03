import React, { useRef, useEffect } from 'react';

function useOutsideListener(ref: any, onOutsideClick: () => void) {
  useEffect(() => {
    /**
     * call function if clicked outside of element
     */
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onOutsideClick]);
}

type Props = {
  onOutsideClick: () => void;
  children: any;
};
/**
 * Component that calls onOutsideClick if you click outside of it
 */
export default function OutsideKlick(props: Props) {
  const wrapperRef = useRef(null);
  useOutsideListener(wrapperRef, props.onOutsideClick);

  return <div ref={wrapperRef}>{props.children}</div>;
}
