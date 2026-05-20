import React, {
  ElementType,
  ComponentPropsWithoutRef,
} from "react";

import "./Text.css";

type TextProps<T extends ElementType> = {
  text: string;
  as?: T;
} & ComponentPropsWithoutRef<T>;

export default function Text<
  T extends ElementType = "p"
>({
  text,
  as,
  ...props
}: TextProps<T>) {
  const Component = as || "p";

  return React.createElement(
    Component,
    props,
    text
  );
}