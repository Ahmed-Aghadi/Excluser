import React from "react"
import { Player, useCreateStream, useStream, getPlaybackInfo } from "@livepeer/react"

import { usePlaybackInfo } from "@livepeer/react/hooks"
import { Box, Button, TextInput } from "@mantine/core"

import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import {
    CreateSignedPlaybackBody,
    CreateSignedPlaybackResponse,
    ApiError,
} from "../pages/api/sign-jwt"

const stream = {
    id: "df43b179-9835-4285-9d35-c6595a178349",
    playbackId: "df43zvg6ze4nx6g8",
    name: "try",
}
// const playbackInfo: GetPlaybackInfoArgs<PlaybackInfo> = {
//     playbackId: "df43zvg6ze4nx6g8",
// }

export const AccessControlTry = () => {
    // const [streamName, setStreamName] = useState<string>("")
    // const { data: createdStream } = useStream("df43b179-9835-4285-9d35-c6595a178349")
    // const {
    //     mutate: createStream,
    //     data: createdStream,
    //     status,
    // } = useCreateStream(
    //     streamName
    //         ? {
    //               name: streamName,
    //               playbackPolicy: { type: "jwt" },
    //           }
    //         : null
    // )

    const { data: stream } = useStream({
        streamId: "df43b179-9835-4285-9d35-c6595a178349",
        refetchInterval: (stream) => (!stream?.isActive ? 5000 : false),
    })

    // const { data: playbackInfo } = usePlaybackInfo({
    //     playbackId: stream?.playbackId,
    //     refetchInterval: (playbackInfo) => (!playbackInfo?.meta.live ? 5000 : false),
    // })
    // console.log("playbackInfo", playbackInfo)

    console.log("stream", stream)

    // getPlaybackInfo(stream.playbackId).then((data) => {
    //     console.log("data1", data)
    // })

    const { mutate: createJwt, data: createdJwt } = useMutation({
        mutationFn: async () => {
            if (!stream?.playbackId) {
                throw new Error("No playback ID yet.")
            }

            const body: CreateSignedPlaybackBody = {
                playbackId: stream.playbackId,
                // we pass along a "secret key" to demonstrate how gating can work
                secret: "supersecretkey",
            }

            // we make a request to the Next.JS API route shown above
            const response = await fetch("/api/sign-jwt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            return response.json() as Promise<CreateSignedPlaybackResponse | ApiError>
        },
    })

    console.log("createdJwt", createdJwt)

    useEffect(() => {
        if (stream?.playbackId) {
            console.log("createJwt...")
            // when we have a playbackId for the stream, create a JWT
            createJwt()
        }
    }, [stream?.playbackId, createJwt])

    // const isLoading = useMemo(() => status === "loading", [status])

    return (
        <Box>
            {!stream?.id ? (
                <>
                    {/* <TextInput onChange={(e) => setStreamName(e.target.value)} /> */}
                    <Box>
                        {/* <Button
                            onClick={() => {
                                createStream?.()
                            }}
                            disabled={isLoading || !createStream || Boolean(stream)}
                        >
                            Create Gated Stream
                        </Button> */}
                    </Box>
                </>
            ) : (
                <Player
                    title={stream?.name}
                    playbackId={stream?.playbackId}
                    autoPlay
                    muted
                    jwt={(createdJwt as CreateSignedPlaybackResponse)?.token}
                />
            )}
        </Box>
    )
}
