import { useCallback, useEffect, useState } from 'react'

const useFetchData = (collectionName) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    // getData function changes when collectionName changes
    const getData = useCallback(async () => {
        try {
            const res = await fetch(collectionName, {
                credentials: 'include'
            })

            if (!res.ok) {
                alert('Data not found')
            }
            const actualData = await res.json()
            setData(actualData)
        } catch (error) {
            setError(error.message)
        }
    }, [collectionName])

    // getData is called whenenever collectionName changes
    useEffect(() => {
        getData()
    }, [collectionName])

    return { data, error, refetch: getData }
}

export default useFetchData
