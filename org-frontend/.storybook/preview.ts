import { createElement } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { initialize, mswLoader } from "msw-storybook-addon";

import { theme } from "../src/theme";

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  a11y: { disable: true },
};

initialize(
  {
    onUnhandledRequest: (req, print) => {
      if (!req.url.host.includes("api")) {
        return;
      }

      print.warning();
    },
  },
  []
);

export const decorators = [
  (story) => createElement(ChakraProvider, { children: story(), theme }),
];

export const loaders = [mswLoader];
export const tags = ["autodocs"];
