import React, { useEffect, useState } from "react"
import { Orbis } from "@orbisclub/orbis-sdk"
import { useAccount } from "wagmi"

const OrbisContext = React.createContext({
    isConnected: false,
    isLoaded: false,
    orbis: null,
    orbisRes: null,
    // setOrbis: (orbis: any) => {},
    refresh: () => {},
})

export const OrbisContextProvider = (props: any) => {
    const [orbis, setOrbis] = useState<any>()
    const [orbisRes, setOrbisRes] = useState<any>()
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [isLoaded, setIsLoaded] = useState<boolean>(false)
    const { address } = useAccount()

    const refresh = async (manualCall = false) => {
        setIsLoaded(false)

        /** Initialize the Orbis class object */
        let orbis = new Orbis()

        if (orbis) {
            let res = await orbis.isConnected()
            console.log("Connecting to Orbis...")
            if (res.status !== 200 || manualCall) {
                await orbis.connect()
            }
            if (res && address) {
                if (res.details.metadata.address.toLowerCase() !== address.toLowerCase()) {
                    await orbis.connect()
                }
            }
            res = await orbis.isConnected()
            setOrbisRes(res)
            setIsConnected(res.status == 200 ? true : false)
            setIsLoaded(true)
        }
        setOrbis(orbis)
    }

    useEffect(() => {
        refresh()
    }, [address])

    return (
        <OrbisContext.Provider
            value={{
                refresh: () => {
                    refresh(true)
                },
                isConnected: isConnected,
                isLoaded: isLoaded,
                orbis: orbis,
                orbisRes: orbisRes,
                // setOrbis: (orbis: any) => {
                //     setOrbisRes(orbis)
                // },
            }}
        >
            {props.children}
        </OrbisContext.Provider>
    )
}

export default OrbisContext
