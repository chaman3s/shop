import { HtmlHTMLAttributes, ReactNode } from "react";


type CardProps = {
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Card({children ,...props}:CardProps){
    return(
        <div className={` ${props.className}`} {...props}>
            {children}
        </div>
    );
}