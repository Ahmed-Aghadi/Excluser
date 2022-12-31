import React, { useContext, useEffect, useState } from "react"
// import Posts from "./Posts"
import { showNotification, updateNotification } from "@mantine/notifications"
import {
    IconCloudUpload,
    IconX,
    IconDownload,
    IconCheck,
    IconMessageCircle,
    IconPhoto,
    IconNote,
    IconChristmasTree,
    IconVideo,
    IconMessage2,
    IconUserCircle,
} from "@tabler/icons"
import {
    createStyles,
    SimpleGrid,
    Card,
    Image,
    Text,
    Tabs,
    Container,
    AspectRatio,
    Button,
    Center,
} from "@mantine/core"
// import NFTs from "./NFTs"
import { useAccount, useSigner } from "wagmi"
import { useRouter } from "next/router"
// import { climateNftTableName, nftTableName, postTableName } from "../constants"
import OrbisContext from "../context/OrbisContext"
import { Layout } from "./Layout"
import UserPage from "./UserPage"
import ChatRoom from "./ChatRoom"
import LivePage from "./LivePage"
import { lockAbi, tableName } from "../constants"
import { ethers } from "ethers"
import useSWR from "swr"
import { useUser } from "../hooks/useUser"
import { MembershipMetadata } from "../types"

function Profile() {
    const { logoutUser, user } = useUser()
    const { data } = useSWR("/api/memberships")
    const { address, isConnected } = useAccount()
    const router = useRouter()
    const { data: signer, isError, isLoading } = useSigner()
    const [posts, setPosts] = useState([])
    const [nfts, setNfts] = useState([])
    const [loading, setLoading] = useState(false)
    const [nftTokenId, setNftTokenId] = useState("")
    const [isNftAvailable, setIsNftAvailable] = useState(false)
    const [isNftCheckLoading, setIsNftCheckLoading] = useState(true)
    const ctx = useContext(OrbisContext)
    const [userDid, setUserDid] = useState("")
    const [isUserFollowing, setIsUserFollowing] = useState(false)
    const [image, setImage] = useState("")
    const [avatar, setAvatar] = useState("")
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [stats, setStats] = useState([
        { label: "Followers", value: "" },
        { label: "Following", value: "" },
        { label: "Subscribers", value: "" },
    ])
    const [userAddress, setUserAddress] = useState("")
    const [lockAddress, setLockAddress] = useState("")
    const [streamId, setStreamId] = useState("")
    const [groupId, setGroupId] = useState("")
    const [mainChannelId, setMainChannelId] = useState("")
    const [usersChannelId, setUsersChannelId] = useState("")
    const [isUserCreator, setIsUserCreator] = useState(false)

    const isUserEligible =
        lockAddress &&
        userAddress &&
        address &&
        ((user?.isLoggedIn &&
            data?.memberships?.some(
                (m) =>
                    m.lockAddress.toLowerCase() === lockAddress.toLowerCase() &&
                    m.owner.toLowerCase() === address.toLowerCase()
            )) ||
            userAddress.toLowerCase() === address.toLowerCase())

    // useEffect(() => {
    //     if (ctx.isConnected) {
    //         ;(async () => {
    //             const res = await fetch(`https://${cid}.ipfs.nftstorage.link/data.json`)
    //             const data = await res.json()
    //             setDescription(data.description)
    //             console.log(data)
    //         })()
    //         ;(async () => {
    //             let { data, error } = await ctx.orbis.getProfile(ctx.orbisRes.did)
    //             if (error) {
    //                 console.log(error)
    //                 return
    //             }
    //             console.log("data", data)
    //             setName(data.username)
    //             setImage(data.details.profile.cover)
    //             setAvatar(data.details.profile.pfp)
    //             setStats((prev) => {
    //                 return [
    //                     { label: "Followers", value: data.count_followers },
    //                     { label: "Following", value: data.count_following },
    //                     { label: "Subscribers", value: prev[2].value },
    //                 ]
    //             })
    //             console.log(data)
    //         })()
    //         ;(async () => {
    //             const contractInstance = new ethers.Contract(
    //                 lockAddress,
    //                 lockAbi,
    //                 ethers.getDefaultProvider(process.env.NEXT_PUBLIC_MUMBAI_RPC_URL)
    //             )

    //             console.log(contractInstance)

    //             const totalSubscribers = await contractInstance.totalSupply()
    //             setStats((prev) => {
    //                 return [
    //                     { label: "Followers", value: prev[0].value },
    //                     { label: "Following", value: prev[1].value },
    //                     { label: "Subscribers", value: totalSubscribers.toString() },
    //                 ]
    //             })
    //         })()
    //     }
    // }, [ctx.isConnected])

    const items = stats.map((stat) => (
        <div key={stat.label}>
            <Text align="center" size="lg" weight={500}>
                {stat.value}
            </Text>
            <Text align="center" size="sm" color="dimmed">
                {stat.label}
            </Text>
        </div>
    ))

    useEffect(() => {}, [signer])

    useEffect(() => {
        if (router.isReady && ctx.isLoaded) {
            console.log("router.isReady", router.isReady)
            if (router.query.userAddress) {
                console.log("userAddress", router.query.userAddress)
                fetchPosts()
            } else {
                if (ctx.isLoaded) {
                    handleUserProfile()
                }
            }
        }
    }, [router, signer, ctx.isLoaded])

    const handleUserProfile = async () => {
        if (!ctx.isConnected) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Sign in to view your profile",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        } else {
            console.log(ctx)
            const did = ctx.orbisRes.did
            router.push("/profile/" + did)
            fetchPosts(did)
        }
    }

    const fetchPosts = async (didArg) => {
        const did = didArg ? didArg : router.query.userAddress[0]
        const userAddress = did.substring(did.length - 42)
        setUserAddress(userAddress.toLowerCase())
        // const did = `did:pkh:eip155:80001:${userAddress.toLowerCase()}`
        setUserDid(did)
        // // const postsData = await fetch("https://testnet.tableland.network/query?s=" + "SELECT * FROM " + postTableName + " LIMIT 10")
        // const postsData = await fetch(
        //     "https://testnet.tableland.network/query?s=" +
        //         "SELECT * FROM " +
        //         postTableName +
        //         " WHERE userAddress = '" +
        //         userAddress.toLowerCase() +
        //         "'"
        // )
        // const postsDataJson = await postsData.json()
        // setPosts(postsDataJson)
        const usersData = await fetch(
            "https://testnet.tableland.network/query?s=" +
                "SELECT * FROM " +
                tableName +
                " WHERE did = '" +
                did +
                "'"
        )
        const usersDataJson = await usersData.json()
        console.log("usersDataJson", usersDataJson)
        if (
            usersDataJson.length === 0 ||
            usersDataJson.message === "Row not found" ||
            !usersDataJson[0]
        ) {
            setIsUserCreator(false)
            fetchFollowersFollowing(did)
            fetchIsFollowing(did)
            setStats((prev) => {
                return [
                    { label: "Followers", value: prev[0].value },
                    { label: "Following", value: prev[1].value },
                    { label: "Subscribers", value: 0 },
                ]
            })
            return
        }
        setIsUserCreator(true)
        setLockAddress(usersDataJson[0].lockAddress)
        ;(async () => {
            const res = await fetch(
                `https://${usersDataJson[0].cid}.ipfs.nftstorage.link/data.json`
            )
            const data = await res.json()
            setDescription(data.description)
            setStreamId(data.streamId)
            setGroupId(data.groupId)
            setMainChannelId(data.mainChannelId)
            setUsersChannelId(data.usersChannelId)
            console.log(data)
        })()
        // ;(async () => {
        // })()
        fetchFollowersFollowing(did)
        // ;(async () => {
        // })()
        fetchSubscribers(usersDataJson)
        // ;(async () => {
        // })()
        fetchIsFollowing(did)
    }

    const fetchFollowersFollowing = async (did) => {
        console.log("did", did)
        let { data, error } = await ctx.orbis.getProfile(did)
        if (error) {
            setStats((prev) => {
                return [
                    { label: "Followers", value: 0 },
                    { label: "Following", value: 0 },
                    { label: "Subscribers", value: prev[2].value },
                ]
            })
            console.log("error", error)
            return
        }
        console.log("followersFollowing: ", data)
        setName(data.username)
        setImage(data.details.profile.cover)
        setAvatar(data.details.profile.pfp)
        setStats((prev) => {
            return [
                { label: "Followers", value: data.count_followers },
                { label: "Following", value: data.count_following },
                { label: "Subscribers", value: prev[2].value },
            ]
        })
        console.log(data)
    }

    const fetchSubscribers = async (usersDataJson) => {
        // console.log("usersDataJson", usersDataJson)
        const contractInstance = new ethers.Contract(
            usersDataJson[0].lockAddress,
            lockAbi,
            ethers.getDefaultProvider(process.env.NEXT_PUBLIC_MUMBAI_RPC_URL)
        )

        console.log(contractInstance)

        const totalSubscribers = await contractInstance.totalSupply()
        setStats((prev) => {
            return [
                { label: "Followers", value: prev[0].value },
                { label: "Following", value: prev[1].value },
                { label: "Subscribers", value: totalSubscribers.toString() },
            ]
        })
    }

    const fetchIsFollowing = async (did) => {
        let { data, error } = await ctx.orbis.getIsFollowing(ctx.orbisRes.did, did)
        console.log("isFollowing: ", data)
        if (data) {
            setIsUserFollowing(true)
        } else {
            setIsUserFollowing(false)
        }
    }

    const userProps = {
        userDid: userDid,
        isUserFollowing: isUserFollowing,
        image: image,
        avatar: avatar,
        name: name,
        description: description,
        stats: stats,
        userAddress: userAddress,
        streamId: streamId,
        groupId: groupId,
        mainChannelId: mainChannelId,
        usersChannelId: usersChannelId,
        lockAddress: lockAddress,
        fetchFollowersFollowing: fetchFollowersFollowing,
        fetchIsFollowing: fetchIsFollowing,
    }

    const chatProps = {
        groupId: groupId,
        usersChannelId: usersChannelId,
        lockAddress: lockAddress,
    }

    // const user = {
    //     image: "https://previews.123rf.com/images/karpenkoilia/karpenkoilia1806/karpenkoilia180600011/102988806-vector-line-web-concept-for-programming-linear-web-banner-for-coding-.jpg",
    //     avatar: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80",
    //     name: "Bill Headbanger",
    //     description:
    //         "Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer Fullstack engineer",
    //     stats: [
    //         { label: "Followers", value: "34K" },
    //         { label: "Following", value: "2K" },
    //         { label: "Subscribers", value: "5K" },
    //     ],
    //     address: "0x123456789",
    // }

    return (
        <Layout>
            <div>
                {isUserEligible ? (
                    isUserCreator ? (
                        <Tabs variant="pills" defaultValue="profile">
                            <Tabs.List>
                                <Tabs.Tab value="profile" icon={<IconUserCircle size={14} />}>
                                    Profile
                                </Tabs.Tab>
                                <Tabs.Tab value="chatroom" icon={<IconMessage2 size={14} />}>
                                    Chat Room
                                </Tabs.Tab>
                                <Tabs.Tab value="live" icon={<IconVideo size={14} />}>
                                    Live
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="profile" pt="xs">
                                <UserPage
                                    {...userProps}
                                    eligible={true}
                                    isUserCreator={isUserCreator}
                                />
                            </Tabs.Panel>

                            <Tabs.Panel value="chatroom" pt="xs">
                                <ChatRoom {...chatProps} />
                            </Tabs.Panel>

                            <Tabs.Panel value="live" pt="xs">
                                <LivePage />
                            </Tabs.Panel>
                        </Tabs>
                    ) : (
                        <div>
                            <UserPage
                                {...userProps}
                                eligible={false}
                                isUserCreator={isUserCreator}
                            />
                        </div>
                    )
                ) : (
                    <div>
                        <UserPage {...userProps} eligible={false} isUserCreator={isUserCreator} />
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default Profile
