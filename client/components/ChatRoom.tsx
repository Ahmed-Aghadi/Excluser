import { Button, Grid, Group, Switch, Textarea, TextInput, useMantineTheme } from "@mantine/core"
import { IconCheck, IconSend, IconX } from "@tabler/icons"
import React, { useContext, useEffect, useState } from "react"
import OrbisContext from "../context/OrbisContext"
import { getCustomEncryptionRules } from "../utils"
import CommentCard from "./CommentCard"
import LitJsSdk from "@lit-protocol/sdk-browser"

interface ChatRoomProps {
    userDid: string
    groupId: string
    usersChannelId: string
    lockAddress: string
}

interface MessageProps {
    id: number
    userDid: string
    username: string
    pfp: string
    title: string
    description: string
    postedAt: string
    streamId: string // message stream id that is docs
    address: string
    did: string
    encrypted: boolean
}

// delay function
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export default function ChatRoom({ userDid, groupId, usersChannelId, lockAddress }: ChatRoomProps) {
    const ctx = useContext(OrbisContext)
    const theme = useMantineTheme()
    const [messages, setMessages] = useState<Array<MessageProps>>([])
    const [message, setMessage] = useState("")
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [isAutoFetching, setIsAutoFetching] = useState(false)
    const [timeoutVar, setTimeoutVar] = useState<any>(null)

    useEffect(() => {
        console.log("useEffect0")
        if (!ctx.isLoaded) return
        console.log("useEffect")
        fetchMessages()
    }, [ctx.isLoaded, ctx.isConnected, ctx.orbis, groupId, usersChannelId])

    useEffect(() => {
        console.log("autoRefresh: ", autoRefresh)
        if (!ctx.isLoaded) return
        autoRefresh && refreshMessages()
    }, [autoRefresh, ctx.isLoaded, ctx.isConnected])

    const refreshMessages = async () => {
        // if (isAutoFetching) return
        // if (!autoRefresh) return
        // console.log("refreshing messages", { autoRefresh, isAutoFetching })
        // setIsAutoFetching(true)
        setAutoRefresh((prev) => {
            if (!prev) return prev
            clearTimeout(timeoutVar)
            fetchMessages().then(() => {
                if (prev) {
                    console.log("setting timeout")
                    setTimeoutVar(setTimeout(() => refreshMessages(), 5000))
                    // await delay(5000)
                }
            })

            return prev
        })
        // setIsAutoFetching(false)
    }

    const fetchMessages = async () => {
        console.log("fetching messages")
        if (groupId == "" || usersChannelId == "") return
        let { data, error } = await ctx.orbis.getPosts({
            context: groupId + "/" + usersChannelId,
        })

        console.log("messages chatroom", data)

        const decryptedMessages = await Promise.all(
            data.map(async (message, index) => {
                if (message.content.data.encrypted == true) {
                    try {
                    } catch (error) {
                        console.log("error decrypting message: ", error)
                        return
                    }
                    // const body = await decryptMessage(message.content)
                    const body = await decryptContent(message.content.data.encryptedContent)
                    // if (!body) return
                    // if (body.status != 200) return
                    return {
                        id: index,
                        userDid: message.creator_details.did,
                        username: message.creator_details.profile.username,
                        pfp: message.creator_details.profile.pfp,
                        title: message.content.title,
                        // description: body.result,
                        description: body,
                        postedAt: new Date(message.timestamp * 1000).toLocaleString(),
                        streamId: message.stream_id,
                        address: message.creator_details.metadata.address,
                        did: message.creator_details.did,
                        encrypted: true,
                    }
                }
                return {
                    id: index,
                    userDid: message.creator_details.did,
                    username: message.creator_details.profile.username,
                    pfp: message.creator_details.profile.pfp,
                    title: message.content.title,
                    description: message.content.body,
                    postedAt: new Date(message.timestamp * 1000).toLocaleString(),
                    streamId: message.stream_id,
                    address: message.creator_details.metadata.address,
                    did: message.creator_details.did,
                    encrypted: false,
                }
            })
        )
        console.log("decryptedPosts chatRoom", decryptedMessages)
        setMessages(decryptedMessages.filter((post) => post))
    }

    const decryptMessage = async (content) => {
        try {
            console.log("decryptingMessage...", content)
            let res = await ctx.orbis.decryptPost(content)
            console.log("res decryptMessage: ", res)
            return res
        } catch (error) {
            console.log("error DecryptMessage: ", error)
            return null
        }
    }

    const sendMessage = async () => {
        if (!message || !message.trim()) return

        const encryptionRulesCustom = getCustomEncryptionRules(lockAddress)
        try {
            // let res = await ctx.orbis.createPost(
            //     {
            //         body: message,
            //         context: groupId + "/" + usersChannelId,
            //     },
            //     encryptionRulesCustom
            // )
            const encryptedContent = await encryptContent(message)
            let res = await ctx.orbis.createPost({
                body: "ENCRYPTED MESSAGE",
                context: groupId + "/" + usersChannelId,
                data: { encrypted: true, encryptedContent: encryptedContent },
            })
            console.log("res: ", res)
            // kjzl6cwe1jw146kc9se22s0lbuhax7n8ra6m3cm2yi2q2bu9440qa8ml7ge0j9o
            if (res.status == 200) {
                resetInput()
                setTimeout(() => {
                    fetchMessages()
                }, 1000)
            }
        } catch (error) {
            console.log("error: ", error)
        }
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
        // decryptContent(encryptedContent)
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

    const resetInput = () => {
        setMessage("")
    }

    const Messages = messages.map((message) => {
        return (
            <CommentCard
                key={message.id}
                postedAt={message.postedAt}
                body={message.description}
                author={{
                    name: message.username,
                    image: message.pfp,
                }}
                address={message.address}
                did={message.did}
                encrypted={message.encrypted}
            />
        )
    })
    return (
        <>
            <Grid align="center">
                <Grid.Col span="auto">
                    <TextInput
                        placeholder="Write a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                // console.log("Enter")
                                sendMessage()
                            }
                        }}
                    />
                </Grid.Col>
                <Grid.Col span="content">
                    <Button onClick={sendMessage}>
                        <IconSend />
                    </Button>
                </Grid.Col>
            </Grid>
            <Switch
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
                color="teal"
                size="md"
                mt="md"
                label="Auto Refresh"
                thumbIcon={
                    autoRefresh ? (
                        <IconCheck
                            size={12}
                            color={theme.colors.teal[theme.fn.primaryShade()]}
                            stroke={3}
                        />
                    ) : (
                        <IconX
                            size={12}
                            color={theme.colors.red[theme.fn.primaryShade()]}
                            stroke={3}
                        />
                    )
                }
            />

            {Messages}
        </>
    )
}
