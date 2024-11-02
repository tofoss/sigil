import { chakra } from "@chakra-ui/react";
import { Outlet } from "shared/Router";

export function Layout() {
	return (
		<chakra.main>
			<Outlet />
		</chakra.main>
	)
}
