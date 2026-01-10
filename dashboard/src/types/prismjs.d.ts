declare module "prismjs" {
  export type Prism = {
    highlightElement: (element: Element) => void;
  };

  const Prism: Prism;
  export default Prism;
}

declare module "prismjs/themes/*";
declare module "prismjs/components/*";

