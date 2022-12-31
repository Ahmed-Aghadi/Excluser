import React from "react"
import { Player, useCreateStream, useStream } from "@livepeer/react"
import { Box, Button, TextInput } from "@mantine/core"

import { useMutation } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

import {
    CreateSignedPlaybackBody,
    CreateSignedPlaybackResponse,
    ApiError,
} from "../pages/api/sign-jwt"

export const AccessControl = () => {
    const [streamName, setStreamName] = useState<string>("")
    const {
        mutate: createStream,
        data: createdStream,
        status,
    } = useCreateStream(
        streamName
            ? {
                  name: streamName,
                  playbackPolicy: { type: "jwt" },
              }
            : null
    )

    const { data: stream } = useStream({
        streamId: createdStream?.id,
        refetchInterval: (stream) => (!stream?.isActive ? 5000 : false),
    })

    console.log("stream", stream)

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
            // when we have a playbackId for the stream, create a JWT
            createJwt()
        }
    }, [stream?.playbackId, createJwt])

    const isLoading = useMemo(() => status === "loading", [status])

    return (
        <Box>
            {!stream?.id ? (
                <>
                    <TextInput onChange={(e) => setStreamName(e.target.value)} />
                    <Box>
                        <Button
                            onClick={() => {
                                createStream?.()
                            }}
                            disabled={isLoading || !createStream || Boolean(stream)}
                        >
                            Create Gated Stream
                        </Button>
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
