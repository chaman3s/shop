import { ReactNode } from "react"
import "./index.css"
type Flexprops={
    children:ReactNode;
} & React.HTMLAttributes<HTMLDivElement>

export default function Flex({children ,...props}:Flexprops) {
   return ( <div  >
    {children}
    </div>)
};

