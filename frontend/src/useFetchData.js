import { useState, useEffect, useCallback } from 'react'

const useFetchData = (collectionName) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    // getData function changes when collectionName changes
    const getData = useCallback(async () => {
        try {
            const res = await fetch(collectionName, {
                method: 'GET',
                headers:
                {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const actualData = await res.json()

            if (!res.ok) {
                alert('Data not found')
            }
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
