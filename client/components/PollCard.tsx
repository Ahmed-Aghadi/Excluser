import {
    Badge,
    Box,
    Card,
    Center,
    createStyles,
    Group,
    Paper,
    Progress,
    RingProgress,
    SimpleGrid,
    Text,
} from "@mantine/core"
import { IconArrowDownRight, IconArrowUpRight, IconDeviceAnalytics } from "@tabler/icons"
import { IChoice } from "@vocdoni/sdk"
import React from "react"

interface PollCardProps {
    pollType: string
    title: string
    description: string
    question: string
    options: Array<IChoice>
    startDate: Date
    endDate: Date
    voteCount: number
    censusSize: number
    vote: (index: number) => void
    userVote: number
}

function perc2color(perc) {
    var r,
        g,
        b = 0
    if (perc < 50) {
        r = 255
        g = Math.round(5.1 * perc)
    } else {
        g = 255
        r = Math.round(510 - 5.1 * perc)
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1
    return "#" + ("000000" + h.toString(16)).slice(-6)
}

export default function PollCard({
    pollType,
    title,
    description,
    question,
    options,
    startDate,
    endDate,
    voteCount,
    censusSize,
    vote,
    userVote,
}: PollCardProps) {
    console.log("options", options)
    console.log("userVote : " + title + " : ", userVote)
    const isEnded = endDate && endDate.getTime() < new Date().getTime()
    if (pollType == "0") {
        return (
            <StatsRing
                question={question}
                total={censusSize.toString()}
                data={options.map((option) => {
                    return {
                        label: option.title.default,
                        stats: option.results,
                        progress:
                            voteCount == 0
                                ? 0
                                : Math.round((parseInt(option.results) / voteCount) * 100),
                        color: perc2color(
                            voteCount == 0
                                ? 0
                                : Math.round((parseInt(option.results) / voteCount) * 100)
                        ),
                    }
                })}
                vote={vote}
                userVote={userVote}
                isEnded={isEnded}
                endDate={endDate}
            />
        )
    } else if (pollType == "1") {
        return (
            <StatsSegments
                data={options.map((option) => {
                    return {
                        label: option.title.default,
                        count: option.results,
                        part:
                            voteCount == 0
                                ? 0
                                : Math.round((parseInt(option.results) / voteCount) * 100),
                        color: perc2color(
                            voteCount == 0
                                ? 0
                                : Math.round((parseInt(option.results) / voteCount) * 100)
                        ),
                        fontColor: perc2color(
                            100 +
                                (voteCount == 0
                                    ? 0
                                    : Math.round((parseInt(option.results) / voteCount) * 100))
                        ),
                    }
                })}
                total={censusSize.toString()}
                question={question}
                vote={vote}
                userVote={userVote}
                isEnded={isEnded}
                endDate={endDate}
            />
        )
    } else {
        return (
            <>
                <Text size="xl" weight={700}>
                    {question}
                </Text>

                {isEnded && (
                    <Badge color="red" variant="filled">
                        Vote Ended
                    </Badge>
                )}

                <Text color="dimmed" size="sm">
                    End date: {new Date(endDate).toLocaleString()}
                </Text>

                <Text color="dimmed" size="sm">
                    out of {censusSize} {censusSize == 1 ? "member" : "members"}
                </Text>
                {options.map((option, index) => {
                    console.log("userVoted", userVote != -1)
                    return (
                        <ProgressCardColored
                            key={index}
                            title={option.title.default}
                            votes={parseInt(option.results)}
                            percentage={
                                voteCount == 0
                                    ? 0
                                    : Math.round((parseInt(option.results) / voteCount) * 100)
                            }
                            vote={() => vote(index)}
                            userVoted={userVote != -1}
                            userVote={userVote == index}
                            isEnded={isEnded}
                        />
                    )
                })}
            </>
        )
    }
}

interface StatsRingProps {
    question: string
    total: string
    data: {
        label: string
        stats: string
        progress: number
        color: string
    }[]
    vote: (index: number) => void
    userVote: number
    isEnded: boolean
    endDate: Date
}

const useStylesStatsRing = createStyles((theme) => ({
    option: {
        cursor: "pointer",
        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
            cursor: "pointer",
        },
    },
}))

export function StatsRing({
    question,
    total,
    data,
    vote,
    userVote,
    isEnded,
    endDate,
}: StatsRingProps) {
    const { classes } = useStylesStatsRing()
    const stats = data.map((stat, index) => {
        return (
            <Paper
                className={userVote == -1 && !isEnded && classes.option}
                withBorder
                radius="md"
                p="xs"
                key={index}
                onClick={() => (!isEnded ? vote(index) : null)}
            >
                <Group>
                    <RingProgress
                        size={80}
                        roundCaps
                        thickness={8}
                        sections={[{ value: stat.progress, color: stat.color }]}
                        label={
                            <Center>
                                <Text size="xs" weight={700}>
                                    {stat.progress}%
                                </Text>
                            </Center>
                        }
                    />

                    <div>
                        <Text size="xl" weight={700}>
                            {stat.label}
                        </Text>
                        <Text color="dimmed" weight={700} size="sm">
                            {stat.stats}
                        </Text>
                        {userVote == index && (
                            <Badge
                                variant="gradient"
                                gradient={{ from: "teal", to: "lime", deg: 105 }}
                            >
                                voted
                            </Badge>
                        )}
                    </div>
                </Group>
            </Paper>
        )
    })
    return (
        <>
            <Text size="xl" weight={700}>
                {question}
            </Text>

            {isEnded && (
                <Badge color="red" variant="filled">
                    Vote Ended
                </Badge>
            )}

            <Text color="dimmed" size="sm">
                End date: {new Date(endDate).toLocaleString()}
            </Text>

            <Text color="dimmed" size="sm">
                out of {total} {total == "1" ? "member" : "members"}
            </Text>
            <SimpleGrid breakpoints={[{ maxWidth: "sm", cols: 1 }]}>{stats}</SimpleGrid>
        </>
    )
}

const useStylesStatsSegments = createStyles((theme) => ({
    progressLabel: {
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        lineHeight: 1,
        fontSize: theme.fontSizes.sm,
    },
    progressBar: {
        border: "1px dashed",
    },

    statVoted: {
        borderBottom: "3px solid",
        paddingBottom: 5,
    },

    stat: {
        borderBottom: "3px solid",
        paddingBottom: 5,
        cursor: "pointer",
        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
            cursor: "pointer",
        },
    },

    statCount: {
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        lineHeight: 1.3,
    },

    diff: {
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        display: "flex",
        alignItems: "center",
    },

    icon: {
        color: theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[4],
    },
}))

interface StatsSegmentsProps {
    total: string
    data: {
        label: string
        count: string
        part: number
        color: string
        fontColor: string
    }[]
    question: string
    vote: (index: number) => void
    userVote: number
    isEnded: boolean
    endDate: Date
}

export function StatsSegments({
    total,
    data,
    question,
    vote,
    userVote,
    isEnded,
    endDate,
}: StatsSegmentsProps) {
    const { classes } = useStylesStatsSegments()

    const segments = data.map((segment) => ({
        value: segment.part,
        color: segment.color,
        label: <Text color={segment.fontColor}>{segment.part}%</Text>,
    }))

    const descriptions = data.map((stat, index) => (
        <Box
            key={index}
            sx={{ borderBottomColor: stat.color }}
            className={userVote == -1 && !isEnded ? classes.stat : classes.statVoted}
            onClick={() => (!isEnded ? vote(index) : null)}
        >
            <Text size="md" color="dimmed" weight={700}>
                {stat.label}
            </Text>

            {userVote == index && (
                <Badge variant="gradient" gradient={{ from: "teal", to: "lime", deg: 105 }}>
                    voted
                </Badge>
            )}

            <Group position="apart" align="flex-end" spacing={0}>
                <Text weight={700} size="sm">
                    {stat.count}
                </Text>
                <Text color={stat.fontColor} weight={700} size="sm" className={classes.statCount}>
                    {stat.part}%
                </Text>
            </Group>
        </Box>
    ))

    return (
        <Paper withBorder p="md" radius="md">
            <Group position="apart">
                <Group align="flex-end" spacing="xs">
                    <Text size="xl" weight={700}>
                        {question}
                    </Text>
                </Group>
            </Group>

            {isEnded && (
                <Badge color="red" variant="filled">
                    Vote Ended
                </Badge>
            )}

            <Text color="dimmed" size="sm">
                End date: {new Date(endDate).toLocaleString()}
            </Text>

            <Text color="dimmed" size="sm">
                out of {total} {total == "1" ? "member" : "members"}
            </Text>

            <Progress
                // @ts-ignore
                sections={segments}
                size={34}
                classNames={{ label: classes.progressLabel, bar: classes.progressBar }}
                mt={40}
            />
            <SimpleGrid cols={3} breakpoints={[{ maxWidth: "xs", cols: 1 }]} mt="xl">
                {descriptions}
            </SimpleGrid>
        </Paper>
    )
}

const useStylesProgressCardColored = createStyles((theme) => ({
    votedCard: {
        backgroundColor: theme.fn.primaryColor(),
    },
    card: {
        backgroundColor: theme.fn.primaryColor(),
        cursor: "pointer",
        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
            cursor: "pointer",
        },
    },
    title: {
        color: theme.fn.rgba(theme.white, 0.65),
    },

    stats: {
        color: theme.white,
    },

    progressBar: {
        backgroundColor: theme.white,
    },

    progressTrack: {
        backgroundColor: theme.fn.rgba(theme.white, 0.4),
    },
}))

interface ProgressCardColoredProps {
    title: string
    votes: number
    percentage: number
    vote: () => void
    userVoted: boolean
    userVote: boolean
    isEnded: boolean
}

export function ProgressCardColored({
    title,
    votes,
    percentage,
    vote,
    userVoted,
    userVote,
    isEnded,
}: ProgressCardColoredProps) {
    const { classes } = useStylesProgressCardColored()
    return (
        <Card
            withBorder
            radius="md"
            p="xl"
            mt={"sm"}
            className={userVoted || isEnded ? classes.votedCard : classes.card}
            onClick={() => (!isEnded ? vote() : null)}
        >
            <Text size="lg" weight={500} className={classes.stats}>
                {title}
            </Text>
            <Text size="xs" transform="uppercase" weight={700} className={classes.title}>
                {votes} {votes == 1 ? "vote" : "votes"} ({percentage}%)
            </Text>
            {userVoted && userVote && (
                <Badge variant="gradient" gradient={{ from: "teal", to: "lime", deg: 105 }}>
                    voted
                </Badge>
            )}
            <Progress
                value={percentage}
                mt="md"
                size="lg"
                radius="xl"
                classNames={{
                    root: classes.progressTrack,
                    bar: classes.progressBar,
                }}
            />
        </Card>
    )
}
