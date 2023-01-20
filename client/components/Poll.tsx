import { Button } from "@mantine/core"
import { EnvOptions, VocdoniSDKClient, Vote, IChoice } from "@vocdoni/sdk"
import React, { useContext, useEffect, useState } from "react"
import { useSigner } from "wagmi"
import OrbisContext from "../context/OrbisContext"
import PollCard from "./PollCard"

interface PollProps {
    pollId: string
    pollType: string
    streamId: string
}
export default function Poll({ pollId, pollType, streamId }: PollProps) {
    const ctx = useContext(OrbisContext)
    const { data: signer } = useSigner()
    const [title, setTitle] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [question, setQuestion] = useState<string>("")
    const [options, setOptions] = useState<Array<IChoice>>([])
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [voteCount, setVoteCount] = useState<number>(0)
    const [censusSize, setCensusSize] = useState<number>(0)
    const [userVote, setUserVote] = useState<number>(-1)

    useEffect(() => {
        fetchPollInfo()
    }, [])

    const fetchPollInfo = async () => {
        const client = new VocdoniSDKClient({
            env: EnvOptions.DEV, // mandatory, can be 'dev' or 'prod'
            wallet: signer, // optional, the signer used (Metamask, Walletconnect)
        })
        const info = await client.fetchElection(pollId)
        console.log("info", info) // shows election information and metadata
        setTitle(info.title.default)
        setDescription(info.description.default)
        setQuestion(info.questions[0].title.default)
        setOptions(info.questions[0].choices)
        setStartDate(info.startDate)
        setEndDate(info.endDate)
        setVoteCount(info.voteCount)

        const res = await fetch(
            "https://api-dev.vocdoni.net/v2/censuses/" + info.census.censusId + "/size",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )
        const censusSize = await res.json()
        console.log("censusSize", censusSize)
        setCensusSize(censusSize.size)

        let { data, error } = await ctx.orbis.getPosts({
            master: streamId,
            did: ctx.orbisRes.did,
        })
        console.log("test: ", { data, error })

        if (data.length === 0) {
            setUserVote(-1)
        } else {
            setUserVote(parseInt(data[0].content.body))
        }
    }

    const vote = async (index: number) => {
        if (userVote !== -1) {
            return
        }
        console.log("voting for ", index)
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
        console.log("pollId", pollId)
        client.setElectionId(pollId)
        const vote = new Vote([index])
        console.log("vote", vote)
        const voteId = await client.submitVote(vote)
        console.log("voteId", voteId)
        // 9b1152f7096c3216cd53e98c4865b756efd5e78bfac2510f85a3a3df0c64a234
        fetchPollInfo()
        setTimeout(() => {
            fetchPollInfo()
        }, 12000)

        let res = await ctx.orbis.createPost({
            body: index.toString(),
            master: streamId,
        })
        console.log("res: ", res)
    }

    return (
        <>
            <PollCard
                pollType={pollType}
                title={title}
                description={description}
                question={question}
                options={options}
                startDate={startDate}
                endDate={endDate}
                voteCount={voteCount}
                censusSize={censusSize}
                vote={vote}
                userVote={userVote} // pass -1 if no vote has been casted from the current user
            />
            {/* <Button
                onClick={() => {
                    vote()
                }}
            >
                Vote
            </Button>
            <Button
                onClick={() => {
                    printConsole()
                }}
            >
                console
            </Button> */}
        </>
    )
}
