import React, { useState } from 'react'
import loadStuffFromApi from '../../io'
import './DataRetrieval.css'

const DataRetrieval = () => {
    const [myData, setMyData] = useState("initial state")

    const getData = () => {
        loadStuffFromApi()
            .then(stuff => {
                setMyData(`from api: ${JSON.stringify(stuff)}`)
            })
            .catch(err => {
                setMyData(`${JSON.stringify(err)}`)
            })
    }

    return (
        <div className='centered'>
            <button onClick = { () => getData() }>Hent ting fra API</button>
            <p>{ myData }</p>
        </div>
    )
}

export default DataRetrieval