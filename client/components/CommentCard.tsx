import {
    createStyles,
    Text,
    Avatar,
    Group,
    TypographyStylesProvider,
    Paper,
    Badge,
} from "@mantine/core"
import { useRouter } from "next/router"

const useStyles = createStyles((theme) => ({
    comment: {
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
    },

    body: {
        paddingLeft: 54,
        paddingTop: theme.spacing.sm,
        fontSize: theme.fontSizes.sm,
    },

    content: {
        "& > p:last-child": {
            marginBottom: 0,
        },
    },
}))

interface CommentHtmlProps {
    postedAt: string
    body: string
    author: {
        name: string
        image: string
    }
    address: string
    did: string
    encrypted: boolean
}

export default function CommentCard({
    postedAt,
    body,
    author,
    address,
    did,
    encrypted,
}: CommentHtmlProps) {
    const { classes } = useStyles()
    const router = useRouter()
    return (
        <Paper withBorder radius="md" className={classes.comment}>
            <Group>
                <Avatar
                    src={author.image}
                    alt={author.name}
                    radius="xl"
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                        window.location.href = `/profile/${did}`
                    }}
                />
                <div>
                    <Text size="sm">{author.name}</Text>
                    <Text size="xs" color="dimmed">
                        {postedAt}
                    </Text>
                    {encrypted && (
                        <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                            ENCRYPTED
                        </Badge>
                    )}
                </div>
            </Group>
            <TypographyStylesProvider className={classes.body}>
                <div className={classes.content} dangerouslySetInnerHTML={{ __html: body }} />
            </TypographyStylesProvider>
        </Paper>
    )
}
