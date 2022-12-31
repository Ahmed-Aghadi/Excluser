import { ReactNode } from "react"
import { AppShell, Navbar, Header, Text, Grid } from "@mantine/core"
import { NavbarMinimal } from "../components/Navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { useRouter } from "next/router"
import { IconCircleDotted } from "@tabler/icons"

interface Props {
    children?: ReactNode
}

export function Layout({ children }: Props) {
    const { isConnected } = useAccount()
    const router = useRouter()

    const titleClick = () => {
        router.push("/")
    }
    return (
        <AppShell
            padding="md"
            navbar={<NavbarMinimal />}
            header={
                <Header height={60} p="xs">
                    <Grid justify="space-between" columns={2} align="center" pl={35} pr={35} mt={2}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                titleClick()
                            }}
                        >
                            <Text size={25} weight={700} sx={{ marginRight: "5px" }}>
                                Excluser
                            </Text>
                            <IconCircleDotted size={35} />
                        </div>
                        <div>
                            <ConnectButton />
                        </div>
                        {/* <ConnectButton /> */}
                    </Grid>
                </Header>
            }
            styles={(theme) => ({
                main: {
                    backgroundColor:
                        theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                },
            })}
        >
            {children}
        </AppShell>
    )
}
