import React, { useState, forwardRef, useEffect, useContext } from "react"
import {
    createStyles,
    Card,
    Avatar,
    Text,
    Group,
    Button,
    Stack,
    Input,
    Select,
    CloseButton,
    Tooltip,
    Textarea,
    TextInput,
    Center,
    Grid,
    Modal,
    Indicator,
    Image,
    Badge,
} from "@mantine/core"
import { IconChartDots3, IconCheck, IconCirclePlus, IconMessage2Share, IconX } from "@tabler/icons"
import OrbisContext from "../context/OrbisContext"
import { showNotification, updateNotification } from "@mantine/notifications"
import { Election, EnvOptions, PlainCensus, VocdoniSDKClient, IChoice } from "@vocdoni/sdk"
import { useAccount, useSigner } from "wagmi"
import Poll from "./Poll"
import PollCard from "./PollCard"
import { DatePicker, TimeInput } from "@mantine/dates"
import { useRouter } from "next/router"
import { getCustomEncryptionRules } from "../utils"
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone"
const { Alchemy, Network } = require("alchemy-sdk")
import LitJsSdk from "@lit-protocol/sdk-browser"

const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_API_KEY,
    network: Network.MATIC_MUMBAI,
}
const alchemy = new Alchemy(config)

const data = [
    {
        image: <IconMessage2Share />,
        label: "Create a post",
        value: "post",
        description: "A post with title and description",
    },

    {
        image: <IconChartDots3 />,
        label: "Create a poll",
        value: "poll",
        description: "Various types of polls can be created",
    },
    // {
    //     image: "https://img.icons8.com/clouds/256/000000/homer-simpson.png",
    //     label: "Homer Simpson",
    //     value: "Homer Simpson",
    //     description: "Overweight, lazy, and often ignorant",
    // },
    // {
    //     image: "https://img.icons8.com/clouds/256/000000/spongebob-squarepants.png",
    //     label: "Spongebob Squarepants",
    //     value: "Spongebob Squarepants",
    //     description: "Not just a sponge",
    // },
]

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
    image: string
    label: string
    description: string
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ image, label, description, ...others }: ItemProps, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                {/* <Avatar src={image} /> */}
                {image}

                <div>
                    <Text size="sm">{label}</Text>
                    <Text size="xs" opacity={0.65}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    )
)

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    },

    avatar: {
        border: `2px solid ${theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white}`,
    },
}))

export const pollTypes = [
    {
        label: "Type 1",
        value: 0,
    },
    {
        label: "Type 2",
        value: 1,
    },
    {
        label: "Type 3",
        value: 2,
    },
]

interface UserCardImageProps {
    userDid: string
    isUserFollowing: boolean
    image: string
    avatar: string
    name: string
    description: string
    stats: { label: string; value: string }[]
    userAddress: string
    streamId: string
    groupId: string
    mainChannelId: string
    usersChannelId: string
    lockAddress: string
    eligible: boolean
    fetchFollowersFollowing: (did: string) => void
    fetchIsFollowing: (did: string) => void
    isUserCreator: boolean
}

const DEMO_VOTE_CENSUS_SIZE = 1000

export default function UserPage({
    userDid,
    isUserFollowing,
    image,
    avatar,
    name,
    description,
    stats,
    userAddress,
    streamId,
    groupId,
    mainChannelId,
    usersChannelId,
    lockAddress,
    eligible,
    fetchFollowersFollowing,
    fetchIsFollowing,
    isUserCreator,
}: UserCardImageProps) {
    const { classes, theme } = useStyles()
    const ctx = useContext(OrbisContext)
    const router = useRouter()
    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()
    // console.log({
    //     image,
    //     avatar,
    //     name,
    //     description,
    //     stats,
    //     userAddress,
    //     streamId,
    //     groupId,
    //     mainChannelId,
    //     usersChannelId,
    // })

    const [editProfileModalOpened, setEditProfileModalOpened] = useState(false)
    const [profileUsername, setProfileUsername] = useState(name)
    const [isProfilePfpChanged, setIsProfilePfpChanged] = useState(false)
    const [isProfileCoverChanged, setIsProfileCoverChanged] = useState(false)
    const [profilePfp, setProfilePfp] = useState<FileWithPath[]>()
    const profilePfpImageUrl =
        profilePfp && profilePfp.length != 0 ? URL.createObjectURL(profilePfp[0]) : null
    const [profileCover, setProfileCover] = useState<FileWithPath[]>()
    const profileCoverImageUrl =
        profileCover && profileCover.length != 0 ? URL.createObjectURL(profileCover[0]) : null

    const [posts, setPosts] = useState([])

    const [buttonClicked, setButtonClicked] = useState(false)
    const [postType, setPostType] = useState("post")

    const [postTitleOpened, setPostTitleOpened] = useState(false)
    const [postTitle, setPostTitle] = useState("")
    const postTitleValid = postTitle.trim().length > 0

    const [postDescriptionOpened, setPostDescriptionOpened] = useState(false)
    const [postDescription, setPostDescription] = useState("")
    const postDescriptionValid = postDescription.trim().length > 0

    const [pollQuestionOpened, setPollQuestionOpened] = useState(false)
    const [pollQuestion, setPollQuestion] = useState("")
    const pollQuestionValid = pollQuestion.trim().length > 0

    const [pollOptionsOpened, setPollOptionsOpened] = useState([false, false])
    const [pollOptions, setPollOptions] = useState(["", ""])
    // const postOptionsValid = postOptions.every((option) => option.trim().length > 0)
    const pollOptionsValids = pollOptions.map((option) => option.trim().length > 0)
    const pollOptionsValid = pollOptionsValids.every((option) => option)

    const [pollType, setPollType] = useState(0)
    const [pollTypeModalOpened, setPollTypeModalOpened] = useState(false)

    const [demoOptions, setDemoOptions] = useState<Array<IChoice>>()
    const [demoVoteCount, setDemoVoteCount] = useState(0)

    const [pollEndDate, setPollEndDate] = useState(new Date())
    const [pollEndTime, setPollEndTime] = useState(new Date())
    // combine date and time
    const pollEndDateTime = new Date(pollEndDate)
    pollEndDateTime.setHours(pollEndTime.getHours())
    pollEndDateTime.setMinutes(pollEndTime.getMinutes())
    pollEndDateTime.setSeconds(pollEndTime.getSeconds())
    // console.log("date", { pollEndDate, pollEndTime, pollEndDateTime })

    const resetInputs = () => {
        setPostTitle("")
        setPostDescription("")
        setPostType("post")
        setPollQuestion("")
        setPollOptions((prev) => prev.map(() => ""))
    }

    const addOption = () => {
        setPollOptions((prev) => [...prev, ""])
        setPollOptionsOpened((prev) => [...prev, false])
    }

    const removeOption = (index: number) => {
        if (pollOptions.length <= 2) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Cannot remove option",
                message: "You must have at least 2 options",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        setPollOptions((prev) => prev.filter((_, i) => i !== index))
        setPollOptionsOpened((prev) => prev.filter((_, i) => i !== index))
    }

    const valid =
        postTitleValid &&
        postDescriptionValid &&
        (postType == "post" ? true : pollQuestionValid && pollOptionsValid)

    useEffect(() => {
        if (!ctx.isLoaded || !eligible || !isUserCreator) return

        fetchPostsFromOrbis()
    }, [ctx.isLoaded, groupId, mainChannelId, userAddress])

    const fetchPostsFromOrbis = async () => {
        console.log("lockAddress", lockAddress)
        // let { data, error } = await ctx.orbis.getCredentials(ctx.orbisRes.did)
        // console.log("data: ", data)
        // console.log("error: ", error)

        // let res = await ctx.orbis.createPost({ body: "gm!" })
        // console.log("res: ", res)

        console.log("groupId / mainChannelId", groupId + "/" + mainChannelId)
        let { data, error } = await ctx.orbis.getPosts({
            context: groupId + "/" + mainChannelId,
            did: userDid,
        })
        console.log("data posts : ", data)
        console.log("error : ", error)
        if (error) return
        const decryptedPosts = await Promise.all(
            data.map(async (post, index) => {
                if (post.content.data.postType == "poll") {
                    if (post.content.data.encrypted == true) {
                        try {
                            // const body = await decryptPost(post.content)
                            const body = await decryptContent(post.content.data.encryptedContent)
                            // if (!body) return
                            // if (body.status != 200) return
                            return {
                                id: index,
                                postType: post.content.data.postType,
                                pollId: post.content.data.pollId,
                                pollType: post.content.data.pollType,
                                title: post.content.title,
                                // description: body.result,
                                description: body,
                                postedAt: new Date(post.timestamp * 1000).toLocaleString(),
                                stream_id: post.stream_id,
                                encrypted: true,
                            }
                        } catch (error) {
                            console.log("error decrypt", error)
                            return
                        }
                    }
                    return {
                        id: index,
                        postType: post.content.data.postType,
                        pollId: post.content.data.pollId,
                        pollType: post.content.data.pollType,
                        title: post.content.title,
                        description: post.content.body,
                        postedAt: new Date(post.timestamp * 1000).toLocaleString(),
                        stream_id: post.stream_id,
                        encrypted: false,
                    }
                }
                if (post.content.data.encrypted == true) {
                    try {
                        // const body = await decryptPost(post.content)
                        const body = await decryptContent(post.content.data.encryptedContent)
                        // if (!body) return
                        // if (body.status != 200) return
                        return {
                            id: index,
                            postType: post.content.data.postType,
                            title: post.content.title,
                            // description: body.result,
                            description: body,
                            postedAt: new Date(post.timestamp * 1000).toLocaleString(),
                            stream_id: post.stream_id,
                            encrypted: true,
                        }
                    } catch (error) {
                        console.log("error decrypt", error)
                        return
                    }
                }
                return {
                    id: index,
                    postType: post.content.data.postType,
                    title: post.content.title,
                    description: post.content.body,
                    postedAt: new Date(post.timestamp * 1000).toLocaleString(),
                    stream_id: post.stream_id,
                    encrypted: false,
                }
            })
        )
        // console.log("decryptedPosts", decryptedPosts)
        setPosts(decryptedPosts.filter((post) => post))
        // setPosts(
        //     data.map(async (post, index) => {
        //         console.log("index ", index)
        //         if (post.content.data.postType == "poll") {
        //             return {
        //                 id: index,
        //                 postType: post.content.data.postType,
        //                 pollId: post.content.data.pollId,
        //                 pollType: post.content.data.pollType,
        //                 title: post.content.title,
        //                 description: post.content.body,
        //                 postedAt: new Date(post.timestamp * 1000).toLocaleString(),
        //             }
        //         }
        //         if (post.content.encryptedBody) {
        //             const body = await decryptPost(post.content)
        //             if (!body) return
        //             if (body.status != 200) return
        //             return {
        //                 id: index,
        //                 postType: post.content.data.postType,
        //                 title: post.content.title,
        //                 description: body.result,
        //                 postedAt: new Date(post.timestamp * 1000).toLocaleString(),
        //             }
        //         }
        //         console.log("not encrypted", post.content)
        //         return {
        //             id: index,
        //             postType: post.content.data.postType,
        //             title: post.content.title,
        //             description: post.content.body,
        //             postedAt: new Date(post.timestamp * 1000).toLocaleString(),
        //         }
        //     })
        // )
    }

    const handleSubmit = async () => {
        console.log("submitting")
        if (!ctx.isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please sign in to orbis",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!valid) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Cannot create",
                message: "Filled in all the required fields",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        showNotification({
            id: "load-data",
            loading: true,
            title: "Posting...",
            message: "Please wait while we are creating membership contract on the blockchain",
            autoClose: false,
            disallowClose: true,
        })
        try {
            console.log({ postTitle, postDescription, postType })
            const encryptionRulesCustom = getCustomEncryptionRules(lockAddress)
            console.log("encryptionRulesCustom: ", encryptionRulesCustom)
            if (postType === "post") {
                // let res = await ctx.orbis.createPost(
                //     {
                //         title: postTitle,
                //         body: postDescription,
                //         context: groupId + "/" + mainChannelId,
                //         data: { postType: "post" },
                //     },
                //     encryptionRulesCustom
                // )
                const encryptedContent = await encryptContent(postDescription)
                let res = await ctx.orbis.createPost({
                    title: postTitle,
                    body: "ENCRYPTED CONTENT",
                    context: groupId + "/" + mainChannelId,
                    data: { postType: "post", encrypted: true, encryptedContent: encryptedContent },
                })
                console.log("res: ", res)
                if (res.status !== 200) {
                    updateNotification({
                        id: "load-data",
                        autoClose: 5000,
                        title: "Unable to create a post in Orbis",
                        message: "Check console for more details",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
            } else {
                if (!isConnected) {
                    showNotification({
                        id: "hello-there",
                        autoClose: 5000,
                        title: "Connect Wallet",
                        message: "Please connect your wallet to post content",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
                // let res = await ctx.orbis.createPoll({ body: postDescription })
                // console.log("res: ", res)
                const client = new VocdoniSDKClient({
                    env: EnvOptions.DEV, // mandatory, can be 'dev' or 'prod'
                    wallet: signer, // optional, the signer used (Metamask, Walletconnect)
                })
                console.log("client: ", client)
                const info = await client.createAccount()
                console.log("info", info) // will show account information
                if (info.balance === 0) {
                    await client.collectFaucetTokens()
                }
                const census = new PlainCensus()
                // accepts any ethereum-alike addresses
                census.add(address)
                const owners = await getOwnersOfNFTContract(lockAddress)
                owners.owners.forEach((owner) => {
                    census.add(owner)
                })
                // @ts-ignore
                const election = Election.from({
                    title: postTitle,
                    description: postDescription,
                    // a header image for your process (this is for example purposes; avoid using random sources)
                    header: "https://source.unsplash.com/random/2048x600",
                    endDate: pollEndDateTime,
                    census,
                })
                console.log("census: ", census)
                console.log("election: ", election)
                console.log(
                    "pollOptions Modified: ",
                    pollOptions.map((option, index) => ({ title: option, value: index }))
                )
                console.log("election.addQuestion args: ", {
                    pollQuestion,
                    pollOptions: pollOptions.map((option, index) => ({
                        title: option,
                        value: index,
                    })),
                })
                election.addQuestion(
                    pollQuestion,
                    "pollDesc",
                    pollOptions.map((option, index) => ({ title: option, value: index }))
                )
                console.log("election1: ", election)
                const id = await client.createElection(election)
                console.log("id", id) // will show the created election id
                // id =  c5d2460186f70de82dcc40b8468639251b089f8b4a4400022e04020000000000
                // let res = await ctx.orbis.createPost(
                //     {
                //         title: postTitle,
                //         body: postDescription,
                //         context: groupId + "/" + mainChannelId,
                //         data: { postType: "poll", pollId: id, pollType: pollType },
                //     },
                //     encryptionRulesCustom
                // )
                const encryptedContent = await encryptContent(postDescription)
                let res = await ctx.orbis.createPost({
                    title: postTitle,
                    body: "ENCRYPTED CONTENT",
                    context: groupId + "/" + mainChannelId,
                    data: {
                        postType: "poll",
                        pollId: id,
                        pollType: pollType,
                        encrypted: true,
                        encryptedContent: encryptedContent,
                    },
                })
                console.log("res: ", res)
                if (res.status !== 200) {
                    updateNotification({
                        id: "load-data",
                        autoClose: 5000,
                        title: "Unable to create a post for poll in Orbis",
                        message: "Check console for more details",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
            }
            setButtonClicked(false)
            resetInputs()
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Posted Successfully",
                message: postType.charAt(0).toUpperCase() + postType.slice(1) + " has been created",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            setTimeout(() => {
                fetchPostsFromOrbis()
            }, 2000)
        } catch (error) {
            console.log("error: ", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create a " + postType,
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }
    // useEffect(() => {
    //     if (lockAddress) {
    //         console.log("lockAddress: ", lockAddress)
    //         getOwnersOfNFTContract(lockAddress)
    //     }
    // }, [lockAddress])

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

    // const posts = [
    //     {
    //         id: 1,
    //         title: "Post 1",
    //         description: "Post 1 description",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 2,
    //         title: "Post 2",
    //         description:
    //             "Post 2 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. ",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 3,
    //         title: "Post 3",
    //         description:
    //             "Post 3 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at sapien et sapien egestas egestas ac ac justo. Donec efficitur placerat felis ac molestie. Suspendisse egestas vitae turpis et faucibus. Nam sodales congue risus, vitae tincidunt est blandit quis. Nullam sed suscipit leo. Vivamus maximus mauris velit, vitae suscipit lectus dictum sit amet. Aliquam porta finibus pulvinar. Pellentesque gravida accumsan rutrum. Nam at tellus nec elit viverra viverra. Suspendisse blandit nibh eget fermentum dictum. Etiam fringilla mattis ante, ac blandit dui mollis nec.",
    //         postedAt: "2021-01-01",
    //     },
    //     {
    //         id: 4,
    //         title: "Post 4",
    //         description:
    //             "Post 4 description Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at sapien et sapien egestas egestas ac ac justo. Donec efficitur placerat felis ac molestie. Suspendisse egestas vitae turpis et faucibus. Nam sodales congue risus, vitae tincidunt est blandit quis. Nullam sed suscipit leo. Vivamus maximus mauris velit, vitae suscipit lectus dictum sit amet. Aliquam porta finibus pulvinar. Pellentesque gravida accumsan rutrum. Nam at tellus nec elit viverra viverra. Suspendisse blandit nibh eget fermentum dictum. Etiam fringilla mattis ante, ac blandit dui mollis nec.",
    //         postedAt: "2021-01-01",
    //     },
    // ]

    const decryptPost = async (content) => {
        try {
            console.log("decrypting...", content)
            let res = await ctx.orbis.decryptPost(content)
            console.log("res decryptPost: " + content.title + " : ", res)
            return res
        } catch (error) {
            console.log("error: ", error)
            return null
        }
    }

    const postItems = posts.map((post) => (
        <Card
            key={post.id}
            withBorder
            p="xl"
            radius="md"
            className={classes.card}
            sx={{ width: "50%" }}
        >
            {post.postType == "poll" ? (
                <div key={post.id}>
                    <Text align="center" size="lg" weight={500}>
                        {post.title}
                    </Text>
                    <Text align="center" size="xs" color="dimmed">
                        {post.postedAt}
                    </Text>
                    {post.encrypted && (
                        <Center>
                            <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                                ENCRYPTED
                            </Badge>
                        </Center>
                    )}
                    <Text align="center" size="sm" color="dimmed">
                        {post.description}
                    </Text>
                    <Poll
                        pollId={post.pollId}
                        pollType={post.pollType.toString()}
                        streamId={post.stream_id}
                    />
                </div>
            ) : (
                <div key={post.id}>
                    <Text align="center" size="lg" weight={500}>
                        {post.title}
                    </Text>
                    <Text align="center" size="xs" color="dimmed">
                        {post.postedAt}
                    </Text>
                    {post.encrypted && (
                        <Center>
                            <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                                ENCRYPTED
                            </Badge>
                        </Center>
                    )}
                    <Text align="center" size="sm" color="dimmed">
                        {post.description}
                    </Text>
                </div>
            )}
        </Card>
    ))

    const initializeDemoOptions = async () => {
        let censusSize = DEMO_VOTE_CENSUS_SIZE
        let voteCount = 0
        setDemoOptions(
            pollOptions.map((option, index) => {
                let randomNumber = Math.floor(Math.random() * censusSize)
                censusSize -= randomNumber
                voteCount += randomNumber
                return {
                    title: { default: option },
                    value: index,
                    results: randomNumber.toString(),
                }
            })
        )
        setDemoVoteCount(voteCount)
    }

    const getOwnersOfNFTContract = async (address: string) => {
        console.log("lockAddress: ", address)
        // Get owners
        const owners: { owners: [string] } = await alchemy.nft.getOwnersForContract(address)
        console.log("owners", owners)
        return owners
    }

    const handleFollowUnfollow = async () => {
        if (isUserFollowing) {
            let res = await ctx.orbis.setFollow(userDid, false)
            if (res.status == 200) {
                showNotification({
                    id: "hello-there",
                    autoClose: 5000,
                    title: "Success!",
                    message: "Successfully unfollowed",
                    color: "teal",
                    icon: <IconCheck size={16} />,
                    className: "my-notification-class",
                    loading: false,
                })
            } else {
                showNotification({
                    id: "hello-there",
                    autoClose: 5000,
                    title: "Unable to unfollow",
                    message: "Please try again",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
            }
        } else {
            let res = await ctx.orbis.setFollow(userDid, true)
            if (res.status == 200) {
                showNotification({
                    id: "hello-there",
                    autoClose: 5000,
                    title: "Success!",
                    message: "Successfully followed",
                    color: "teal",
                    icon: <IconCheck size={16} />,
                    className: "my-notification-class",
                    loading: false,
                })
            } else {
                showNotification({
                    id: "hello-there",
                    autoClose: 5000,
                    title: "Unable to follow",
                    message: "Please try again",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
            }
        }
        setTimeout(() => {
            fetchFollowersFollowing(userDid)
            fetchIsFollowing(userDid)
        }, 1000)
    }

    const handleEditProfile = async () => {
        if (!profileUsername || !profileUsername.trim()) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Empty Username",
                message: "Username cannot be empty",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        let args = {
            username: profileUsername,
            pfp: avatar,
            cover: image,
        }
        if (isProfilePfpChanged && profilePfp.length > 0) {
            const body = new FormData()
            body.append("file", profilePfp[0])
            const resForImageCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/image-upload-ipfs",
                {
                    method: "POST",
                    body: body,
                }
            )
            const jsonOfResForImageCid = await resForImageCid.json()
            const imageCid = jsonOfResForImageCid.cid
            args["pfp"] = `https://${imageCid}.ipfs.nftstorage.link/image`
        }
        if (isProfileCoverChanged && profileCover.length > 0) {
            const body = new FormData()
            body.append("file", profileCover[0])
            const resForImageCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/image-upload-ipfs",
                {
                    method: "POST",
                    body: body,
                }
            )
            const jsonOfResForImageCid = await resForImageCid.json()
            const imageCid = jsonOfResForImageCid.cid
            args["cover"] = `https://${imageCid}.ipfs.nftstorage.link/image`
        }
        console.log("args: ", args)
        let res = await ctx.orbis.updateProfile(args)
        if (res.status == 200) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Success!",
                message: "Successfully updated profile",
                color: "teal",
                icon: <IconCheck size={16} />,
                className: "my-notification-class",
                loading: false,
            })
            setEditProfileModalOpened(false)
            router.reload()
        } else {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Unable to update profile",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const resetEditProfileInputs = () => {
        setProfileUsername(name)
        setProfilePfp([])
        setProfileCover([])
        setIsProfilePfpChanged(false)
        setIsProfileCoverChanged(false)
    }

    const encryptContent = async (body: string) => {
        const encryptionRulesCustom = getCustomEncryptionRules(lockAddress).accessControlConditions
        const client = new LitJsSdk.LitNodeClient()
        const chain = "mumbai"
        const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" })
        const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(body)
        await client.connect()
        const encryptedSymmetricKey = await client.saveEncryptionKey({
            evmContractConditions: encryptionRulesCustom,
            symmetricKey,
            authSig,
            chain,
        })
        console.log({ encryptedSymmetricKey })
        let encryptedContentBase64 = await LitJsSdk.blobToBase64String(encryptedString)
        console.log({ encryptedContentBase64 })
        const encryptedContent = {
            toDecrypt: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"),
            encrypted: encryptedContentBase64,
        }
        console.log({ encryptedContent })
        return encryptedContent
    }

    const decryptContent = async (encryptedContent) => {
        const encryptionRulesCustom = getCustomEncryptionRules(lockAddress).accessControlConditions
        const client = new LitJsSdk.LitNodeClient()
        const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" })
        await client.connect()
        console.log("getting symmetric key 2")
        const symmetricKey2 = await client.getEncryptionKey({
            evmContractConditions: encryptionRulesCustom,
            toDecrypt: encryptedContent.toDecrypt,
            chain: "mumbai",
            authSig,
        })
        console.log("symmetric key 2: ", symmetricKey2)
        const decryptedContent = await LitJsSdk.decryptString(
            await LitJsSdk.base64StringToBlob(encryptedContent.encrypted),
            symmetricKey2
        )
        console.log("decrypted content: ", decryptedContent)
        return decryptedContent
    }

    return (
        <>
            <Card withBorder p="xl" radius="md" className={classes.card}>
                <Card.Section sx={{ backgroundImage: `url(${image})`, height: 140 }} />
                <Avatar
                    src={avatar}
                    size={80}
                    radius={80}
                    mx="auto"
                    mt={-30}
                    className={classes.avatar}
                />
                <Text align="center" size="lg" weight={500} mt="sm">
                    {name}
                </Text>
                <Text align="center" size="sm" color="dimmed">
                    {description}
                </Text>
                <Group mt="md" position="center" spacing={30}>
                    {items}
                </Group>
                <Group mt="md" position="center" spacing={30}>
                    {address &&
                        userAddress &&
                        userAddress.toLowerCase() === address.toLowerCase() && (
                            <div>
                                <Button
                                    fullWidth
                                    radius="md"
                                    mt="xl"
                                    size="md"
                                    color={theme.colorScheme === "dark" ? undefined : "dark"}
                                    onClick={() => setEditProfileModalOpened(true)}
                                >
                                    Edit Profile
                                </Button>
                            </div>
                        )}
                    <div>
                        <Button
                            fullWidth
                            radius="md"
                            mt="xl"
                            size="md"
                            color={theme.colorScheme === "dark" ? undefined : "dark"}
                            onClick={handleFollowUnfollow}
                        >
                            {isUserFollowing ? "Unfollow" : "Follow"}
                        </Button>
                    </div>
                    {isUserCreator && (
                        <div>
                            {eligible ? (
                                <Button
                                    fullWidth
                                    radius="md"
                                    mt="xl"
                                    size="md"
                                    color={theme.colorScheme === "dark" ? undefined : "dark"}
                                >
                                    {address &&
                                    userAddress &&
                                    userAddress.toLowerCase() === address.toLowerCase()
                                        ? "Owner"
                                        : "Subscribed!"}
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    radius="md"
                                    mt="xl"
                                    size="md"
                                    color={theme.colorScheme === "dark" ? undefined : "dark"}
                                    component="a"
                                    href={
                                        "/api/login?lockAddress=" +
                                        lockAddress +
                                        "&redirect=" +
                                        router.asPath
                                    }
                                >
                                    Subscribe
                                </Button>
                            )}
                        </div>
                    )}
                </Group>
            </Card>
            <Stack align="center" mt="md" spacing={30}>
                {isUserCreator &&
                    address &&
                    userAddress &&
                    address.toLowerCase() === userAddress.toLowerCase() && (
                        <Button
                            radius="md"
                            mt="xl"
                            size="md"
                            color="yellow"
                            onClick={() => setButtonClicked(true)}
                        >
                            Create
                        </Button>
                    )}
                {buttonClicked && (
                    <Card
                        withBorder
                        p="xl"
                        radius="md"
                        className={classes.card}
                        sx={{ width: "50%" }}
                    >
                        <Group position="right">
                            <CloseButton
                                title="Close"
                                size="xl"
                                iconSize={20}
                                onClick={() => {
                                    resetInputs()
                                    setButtonClicked(false)
                                }}
                            />
                        </Group>
                        <Select
                            label="Type"
                            placeholder="Pick one"
                            required
                            value={postType}
                            onChange={(value) => setPostType(value)}
                            itemComponent={SelectItem}
                            data={data}
                            // searchable
                            maxDropdownHeight={400}
                            nothingFound="Nobody here"
                            filter={(value, item) =>
                                item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
                                item.description.toLowerCase().includes(value.toLowerCase().trim())
                            }
                        />
                        <Text align="center" mt={5} size="lg" weight={500}>
                            {postType.charAt(0).toUpperCase() + postType.slice(1)}
                        </Text>
                        <Tooltip
                            label={postTitleValid ? "All good!" : "Title shouldn't be empty"}
                            position="bottom-start"
                            withArrow
                            opened={postTitleOpened}
                            color={postTitleValid ? "teal" : undefined}
                        >
                            <TextInput
                                label="Title"
                                required
                                placeholder="Your title"
                                // autosize
                                // minRows={2}
                                // maxRows={4}
                                onFocus={() => setPostTitleOpened(true)}
                                onBlur={() => setPostTitleOpened(false)}
                                mt="md"
                                value={postTitle}
                                onChange={(event) => setPostTitle(event.currentTarget.value)}
                            />
                        </Tooltip>
                        <Tooltip
                            label={
                                postDescriptionValid
                                    ? "All good!"
                                    : "Description shouldn't be empty"
                            }
                            position="bottom-start"
                            withArrow
                            opened={postDescriptionOpened}
                            color={postDescriptionValid ? "teal" : undefined}
                        >
                            <Textarea
                                label="Description"
                                required
                                placeholder="Your description"
                                autosize
                                minRows={2}
                                maxRows={4}
                                onFocus={() => setPostDescriptionOpened(true)}
                                onBlur={() => setPostDescriptionOpened(false)}
                                mt="md"
                                value={postDescription}
                                onChange={(event) => setPostDescription(event.currentTarget.value)}
                            />
                        </Tooltip>
                        {/* <Input placeholder="Title" radius="md" mt="xl" size="md" color="yellow" />
                        <Input
                            placeholder="Description"
                            radius="md"
                            mt="xl"
                            size="md"
                            color="yellow"
                        /> */}
                        {postType === "poll" && (
                            <>
                                <Tooltip
                                    label={
                                        pollQuestionValid
                                            ? "All good!"
                                            : "Question shouldn't be empty"
                                    }
                                    position="bottom-start"
                                    withArrow
                                    opened={pollQuestionOpened}
                                    color={pollQuestionValid ? "teal" : undefined}
                                >
                                    <Textarea
                                        label="Question"
                                        required
                                        placeholder="Your question"
                                        autosize
                                        minRows={2}
                                        maxRows={4}
                                        onFocus={() => setPollQuestionOpened(true)}
                                        onBlur={() => setPollQuestionOpened(false)}
                                        mt="md"
                                        value={pollQuestion}
                                        onChange={(event) =>
                                            setPollQuestion(event.currentTarget.value)
                                        }
                                    />
                                </Tooltip>
                                <DatePicker
                                    placeholder="Pick date"
                                    label="End date"
                                    mt="md"
                                    required
                                    value={pollEndDate}
                                    onChange={setPollEndDate}
                                    renderDay={(date) => {
                                        const day = date.getDate()
                                        return (
                                            <Indicator
                                                size={6}
                                                color="red"
                                                offset={8}
                                                disabled={day !== 16}
                                            >
                                                <div>{day}</div>
                                            </Indicator>
                                        )
                                    }}
                                />
                                <TimeInput
                                    mt="md"
                                    required
                                    label="End Time"
                                    withSeconds
                                    value={pollEndTime}
                                    onChange={setPollEndTime}
                                />
                                {pollOptions.map((option, index) => (
                                    <Grid align="center" key={index}>
                                        <Grid.Col span="auto">
                                            <Tooltip
                                                key={index}
                                                label={
                                                    pollOptionsValids[index]
                                                        ? "All good!"
                                                        : "Option shouldn't be empty"
                                                }
                                                position="bottom-start"
                                                withArrow
                                                opened={pollOptionsOpened[index]}
                                                color={
                                                    pollOptionsValids[index] ? "teal" : undefined
                                                }
                                            >
                                                <TextInput
                                                    label={`Option ${index + 1}`}
                                                    required
                                                    placeholder="Your option"
                                                    // autosize
                                                    // minRows={2}
                                                    // maxRows={4}
                                                    onFocus={() => {
                                                        const newPostOptionsOpened = [
                                                            ...pollOptionsOpened,
                                                        ]
                                                        newPostOptionsOpened[index] = true
                                                        setPollOptionsOpened(newPostOptionsOpened)
                                                    }}
                                                    onBlur={() => {
                                                        const newPostOptionsOpened = [
                                                            ...pollOptionsOpened,
                                                        ]
                                                        newPostOptionsOpened[index] = false
                                                        setPollOptionsOpened(newPostOptionsOpened)
                                                    }}
                                                    mt="md"
                                                    value={option}
                                                    onChange={(event) => {
                                                        const newPostOptions = [...pollOptions]
                                                        newPostOptions[index] =
                                                            event.currentTarget.value
                                                        setPollOptions(newPostOptions)
                                                    }}
                                                />
                                            </Tooltip>
                                        </Grid.Col>
                                        <Grid.Col span="content">
                                            <CloseButton
                                                title="Remove"
                                                size="xl"
                                                iconSize={15}
                                                onClick={() => {
                                                    removeOption(index)
                                                }}
                                            />
                                        </Grid.Col>
                                    </Grid>
                                ))}
                                <Center>
                                    <Button
                                        radius="md"
                                        mt="xl"
                                        leftIcon={<IconCirclePlus />}
                                        variant="outline"
                                        onClick={() => {
                                            addOption()
                                        }}
                                    >
                                        Add Option
                                    </Button>
                                </Center>
                                <Select
                                    label="Poll Type"
                                    placeholder="Pick one"
                                    required
                                    value={pollTypes.find((item) => item.value === pollType).label}
                                    onChange={(value) => {
                                        pollTypes.forEach((item) => {
                                            if (item.label === value) {
                                                setPollType(item.value)
                                            }
                                        })
                                    }}
                                    itemComponent={SelectItem}
                                    data={pollTypes.map((item) => {
                                        return item.label
                                    })}
                                    // searchable
                                    maxDropdownHeight={400}
                                    nothingFound="Nobody here"
                                    filter={(value, item) =>
                                        item.label
                                            .toLowerCase()
                                            .includes(value.toLowerCase().trim()) ||
                                        item.description
                                            .toLowerCase()
                                            .includes(value.toLowerCase().trim())
                                    }
                                />
                                <Center>
                                    <Button
                                        radius="md"
                                        mt="xl"
                                        color="gray"
                                        onClick={() => {
                                            initializeDemoOptions()
                                            setPollTypeModalOpened(true)
                                        }}
                                    >
                                        View Poll
                                    </Button>
                                </Center>
                                <Modal
                                    opened={pollTypeModalOpened}
                                    onClose={() => setPollTypeModalOpened(false)}
                                    title="Your poll will look like this:"
                                    size={"50%"}
                                >
                                    <PollCard
                                        pollType={pollType.toString()}
                                        title={postTitle}
                                        description={postDescription}
                                        question={pollQuestion}
                                        options={demoOptions}
                                        startDate={new Date()}
                                        endDate={new Date()}
                                        voteCount={demoVoteCount}
                                        censusSize={DEMO_VOTE_CENSUS_SIZE}
                                        vote={() => {}}
                                        userVote={-1} // pass -1 if no vote has been casted from the current user
                                    />
                                </Modal>
                            </>
                        )}

                        <Button
                            radius="md"
                            mt="xl"
                            size="md"
                            color="orange"
                            onClick={() => {
                                handleSubmit()
                            }}
                        >
                            Submit
                        </Button>
                    </Card>
                )}
                {isUserCreator ? (
                    eligible ? (
                        postItems
                    ) : (
                        <Text size="xl" weight="bold" align="center" mt="xl" color="gray">
                            Look like you don't have membership to access the content. Click
                            subscribe to get a membership or to verify your membership.
                        </Text>
                    )
                ) : (
                    <Text size="xl" weight="bold" align="center" mt="xl" color="gray">
                        {address &&
                        userAddress &&
                        userAddress.toLowerCase() !== address.toLowerCase()
                            ? "Look like this user is not a creator."
                            : "Look like you are not a creator. Click on plus icon to become a creator."}
                    </Text>
                )}

                {/* <Card withBorder p="xl" radius="md" className={classes.card} sx={{ width: "50%" }}>
                    <Poll
                        pollId="c5d2460186f70de82dcc40b8468639251b089f8b4a4400022e04020000000000"
                        pollType="2"
                    />
                </Card> */}
            </Stack>
            <Modal
                opened={editProfileModalOpened}
                onClose={() => {
                    resetEditProfileInputs()
                    setEditProfileModalOpened(false)
                }}
                title="Edit Profile"
                size={"50%"}
            >
                <Text size="xl" weight="bold">
                    Your PFP:
                </Text>
                <Dropzone
                    accept={IMAGE_MIME_TYPE}
                    onDrop={(acceptedFiles) => {
                        setIsProfilePfpChanged(true)
                        setProfilePfp(acceptedFiles)
                    }}
                    sx={{ maxWidth: 150, maxHeight: 150, padding: 0, border: "1px dashed #ccc" }}
                >
                    <Image
                        src={isProfilePfpChanged ? profilePfpImageUrl : avatar}
                        fit="contain"
                        sx={{ maxWidth: 150 }}
                        height={150}
                        imageProps={{ onLoad: () => URL.revokeObjectURL(profilePfpImageUrl) }}
                    />
                </Dropzone>

                <Text size="xl" weight="bold" mt="md">
                    Your Profile Cover:
                </Text>
                <Dropzone
                    accept={IMAGE_MIME_TYPE}
                    onDrop={(acceptedFiles) => {
                        setIsProfileCoverChanged(true)
                        setProfileCover(acceptedFiles)
                    }}
                    sx={{
                        maxWidth: 500,
                        maxHeight: 200,
                        padding: 0,
                        border: "1px dashed #ccc",
                    }}
                >
                    <Image
                        src={isProfileCoverChanged ? profileCoverImageUrl : image}
                        fit="contain"
                        sx={{ maxWidth: 500 }}
                        height={200}
                        imageProps={{ onLoad: () => URL.revokeObjectURL(profileCoverImageUrl) }}
                    />
                </Dropzone>

                <TextInput
                    label="Name"
                    placeholder="Your username"
                    mt="md"
                    value={profileUsername}
                    onChange={(event) => {
                        setProfileUsername(event.currentTarget.value)
                    }}
                />

                <Button
                    radius="md"
                    mt="xl"
                    size="md"
                    color="orange"
                    onClick={() => {
                        handleEditProfile()
                    }}
                >
                    Save
                </Button>
            </Modal>
        </>
    )
}
