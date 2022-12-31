import styles from "../styles/Home.module.css"
import { Layout } from "../components/Layout"
import { useContext, useEffect, useState } from "react"
import OrbisContext from "../context/OrbisContext"
import { Button, Center, Textarea, TextInput, Tooltip } from "@mantine/core"
import { mainAbi, mainContractAddress, tableName } from "../constants"
import { useAccount, useSigner } from "wagmi"
import { useCreateStream } from "@livepeer/react"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons"
import { useRouter } from "next/router"
const ethers = require("ethers")
const abis = require("@unlock-protocol/contracts")

export default function Home() {
    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()
    const [descriptionOpened, setDescriptionOpened] = useState(false)
    const [description, setDescription] = useState("")
    const descriptionValid = description.trim().length > 0

    const [priceOpened, setPriceOpened] = useState(false)
    const [price, setPrice] = useState("")
    const priceValid = !!price && Number.isInteger(parseInt(price)) && price > 0

    const [numberOfMembershipOpened, setNumberOfMembershipOpened] = useState(false)
    const [numberOfMembership, setNumberOfMembership] = useState("")
    const numberOfMembershipValid =
        !!numberOfMembership &&
        Number.isInteger(parseInt(numberOfMembership)) &&
        numberOfMembership > 0

    const valid = descriptionValid && priceValid && numberOfMembershipValid

    const [isSubmitted, setIsSubmitted] = useState(false)

    const ctx = useContext(OrbisContext)
    const router = useRouter()

    const {
        mutate: createStream,
        data: createdStream,
        status,
    } = useCreateStream({
        name: address,
        playbackPolicy: { type: "jwt" },
    })

    useEffect(() => {
        console.log("status", status)
        if (createdStream) {
            console.log("createdStream", createdStream)
            handleSubmitRemaining()
        }
    }, [createdStream, status])

    const deleteStream = async () => {
        const response = await fetch(`https://livepeer.studio/api/stream/${createdStream.id}`, {
            method: "DELETE",
            headers: {
                authorization: `Bearer ${process.env.NEXT_PUBLIC_STUDIO_API_KEY}`,
            },
        })
        console.log("response deleteStream", response)
        // const data = await response.json()
        // console.log("deleteStream", data)
    }

    // Wrapping all calls in an async block
    const deployLock = async () => {
        // Here we use a Rinkeby provider. We will be able to read the state, but not send transactions.
        const provider = new ethers.providers.JsonRpcProvider(
            "https://rpc.unlock-protocol.com/80001"
        )

        // On polygon mumbai Unlock is at
        const unlockAddress = "0x1FF7e338d5E582138C46044dc238543Ce555C963"

        // const signerWithProvider = signer.connect(provider)

        // // Instantiate the Unlock contract
        // const unlock = new ethers.Contract(address, abis.UnlockV11.abi, signerWithProvider)

        // Instantiate the Unlock contract
        const unlock = new ethers.Contract(unlockAddress, abis.UnlockV11.abi, signer)

        // Lock params:
        const lockInterface = new ethers.utils.Interface(abis.PublicLockV11.abi)
        const params = lockInterface.encodeFunctionData(
            "initialize(address,uint256,address,uint256,uint256,string)",
            [
                address,
                31 * 60 * 60 * 24, // 30 days in seconds
                ethers.constants.AddressZero, // We use the base chain currency
                ethers.utils.parseUnits(price.toString(), 18), // 0.01 Eth
                numberOfMembership,
                "New Membership",
            ]
        )

        const transaction = await unlock.createUpgradeableLockAtVersion(params, 11)
        console.log("transaction", transaction)
        console.log("transaction.hash", transaction.hash)
        const receipt = await transaction.wait()
        console.log("receipt", receipt)
        const lockAddress = receipt.logs[0].address
        console.log("lockAddress", lockAddress)
        return lockAddress
    }
    const handleSubmitRemaining = async () => {
        try {
            let orbis = ctx.orbis
            let resGroup = await orbis.createGroup({
                name: "Main " + address,
                description: description,
            })

            console.log("resGroup", resGroup)
            if (resGroup.status !== 200) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to create group on orbis",
                    message: "Check console for more details",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                deleteStream()
                return
            }

            // Main Channel (for posts by owner)
            let resChannel = await orbis.createChannel(resGroup.doc, {
                group_id: resGroup.doc,
                name: "Main",
                description: "Official place to discuss Orbis related stuff.",
            })

            console.log("resChannel", resChannel)
            if (resChannel.status !== 200) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to create main channel on orbis",
                    message: "Check console for more details",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                deleteStream()
                return
            }

            // Users Channel (for all users)
            let resChannel1 = await orbis.createChannel(resGroup.doc, {
                group_id: resGroup.doc,
                name: "Users",
                description: "Official place to discuss Orbis related stuff.",
            })

            console.log("resChannel", resChannel1)
            if (resChannel1.status !== 200) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to create users channel on orbis",
                    message: "Check console for more details",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                deleteStream()
                return
            }

            console.log("ipfs json: ", {
                description: description,
                streamId: createdStream.id,
                groupId: resGroup.doc,
                mainChannelId: resChannel.doc,
                usersChannelId: resChannel1.doc,
            })

            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        description: description,
                        streamId: createdStream.id,
                        groupId: resGroup.doc,
                        mainChannelId: resChannel.doc,
                        usersChannelId: resChannel1.doc,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            // const parsedAmount = ethers.utils.parseUnits(price, "ether")
            // console.log("parsedAmount", parsedAmount)

            const lockAddress = await deployLock()

            const contractInstance = new ethers.Contract(mainContractAddress, mainAbi, signer)

            console.log("args: ", { lockAddress, did: ctx.orbisRes.did, jsonCid })

            const tx = await contractInstance.registerLock(lockAddress, ctx.orbisRes.did, jsonCid)
            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)

            // console.log("response hash")
            // console.log(response.hash)
            console.log("-----------------------------")

            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Posted Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            // for (let i = 0; i < response.events.length; i++) {
            //     const event = response.events[i]
            //     if (event.event === "NFTCreated") {
            //         router.push(`/post/${event.args[0]}`)
            //     }
            // }

            // // setPostModalOpened(false)
            // // navigate("/profile")
            router.push("/profile")
        } catch (error) {
            console.log("error", error)
            deleteStream()
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create membership contract on the blockchain",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleSubmit = async () => {
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
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot post",
                message: "Filled in all the required fields",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        const usersData = await fetch(
            "https://testnet.tableland.network/query?s=" +
                "SELECT * FROM " +
                tableName +
                " WHERE did = '" +
                ctx.orbisRes.did +
                "'"
        )
        const usersDataJson = await usersData.json()
        console.log("usersDataJson", usersDataJson)
        if (
            !(
                usersDataJson.length === 0 ||
                usersDataJson.message === "Row not found" ||
                !usersDataJson[0]
            )
        ) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot create membership contract",
                message: "You have already created a membership contract",
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
            setIsSubmitted(true)
            const r = createStream()
            console.log("r", r)
            console.log("createdStream", createdStream)
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create membership contract on the blockchain",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    return (
        <Layout>
            <div className={styles.container}>
                <Tooltip
                    label={descriptionValid ? "All good!" : "Description shouldn't be empty"}
                    position="bottom-start"
                    withArrow
                    opened={descriptionOpened}
                    color={descriptionValid ? "teal" : undefined}
                >
                    <Textarea
                        label="Description"
                        required
                        placeholder="Your description"
                        autosize
                        minRows={2}
                        maxRows={4}
                        onFocus={() => setDescriptionOpened(true)}
                        onBlur={() => setDescriptionOpened(false)}
                        mt="md"
                        value={description}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip
                    label={priceValid ? "All good!" : "Price should be greater than 0"}
                    position="bottom-start"
                    withArrow
                    opened={priceOpened}
                    color={priceValid ? "teal" : undefined}
                >
                    <TextInput
                        label="Price"
                        required
                        placeholder="Your price"
                        onFocus={() => setPriceOpened(true)}
                        onBlur={() => setPriceOpened(false)}
                        mt="md"
                        type="number"
                        min="0"
                        step="1"
                        onWheel={(e) => e.target.blur()}
                        value={price}
                        onChange={(event) => setPrice(event.currentTarget.value)}
                    />
                </Tooltip>
                <Tooltip
                    label={
                        numberOfMembershipValid
                            ? "All good!"
                            : "Number of memberships should be greater than 0"
                    }
                    position="bottom-start"
                    withArrow
                    opened={numberOfMembershipOpened}
                    color={numberOfMembershipValid ? "teal" : undefined}
                >
                    <TextInput
                        label="Number of memberships"
                        required
                        placeholder="Your number of memberships"
                        onFocus={() => setNumberOfMembershipOpened(true)}
                        onBlur={() => setNumberOfMembershipOpened(false)}
                        mt="md"
                        type="number"
                        min="0"
                        step="1"
                        onWheel={(e) => e.target.blur()}
                        value={numberOfMembership}
                        onChange={(event) => setNumberOfMembership(event.currentTarget.value)}
                    />
                </Tooltip>
                <Center>
                    <Button variant="outline" mt="md" size="md" onClick={() => handleSubmit()}>
                        Submit
                    </Button>
                </Center>
            </div>
        </Layout>
    )
}
