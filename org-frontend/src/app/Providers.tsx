import { ReactNode } from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { theme } from "theme"


interface Props {
	children: ReactNode
}

const Providers = ({ children }: Props) => {
	return (
		<ChakraProvider theme={theme}>
			{children}
		</ChakraProvider>
	)
}

export { Providers }
