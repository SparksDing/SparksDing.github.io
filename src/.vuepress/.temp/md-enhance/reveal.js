import { reveal, revealMarkdown, revealHighlight, revealMath, revealSearch, revealNotes, revealZoom } from "/Users/sparksd/codeCellar/web/blogs/node_modules/vuepress-plugin-md-enhance/lib/client/index.js";

export const useReveal = () => [reveal(), revealMarkdown(), revealHighlight(), revealMath(), revealSearch(), revealNotes(), revealZoom()];
