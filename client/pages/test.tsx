import { Button, Text } from "@mantine/core"
import type { NextPage } from "next"
import Link from "next/link"
import { useEffect } from "react"
import useSWR from "swr"
import { useUser } from "../hooks/useUser"
import { MembershipMetadata } from "../types"

const Home: NextPage = () => {
    const { logoutUser, user } = useUser()
    const { data } = useSWR<{ memberships: MembershipMetadata[] }>("/api/memberships")

    console.log("data", data)

    if (!user?.isLoggedIn) {
        return (
            <>
                <Button
                    component="a"
                    href="/api/login?lockAddress=0x98d8f9ed358da1a2436c967f509a93807d9a42b9"
                >
                    Login
                </Button>
            </>
        )
    }
    console.log("data", data)
    return (
        <>
            <Text>Logged In</Text>
            <Button onClick={() => logoutUser()}>Logout</Button>
        </>
    )
}

export default Home
