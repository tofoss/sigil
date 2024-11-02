import { Box, Text } from "@chakra-ui/react"
import { useRouteError } from "shared/Router"


const HomePage = () => {
	return (
		<Box>
			<Text>Hello, world!</Text>
		</Box>
	)
}

export const Component = HomePage

export const ErrorBoundary = () => {
	const error = useRouteError()

	if (error.status === 404) {
		return <p>404</p> 
	}

	return <p>500</p> 
}
