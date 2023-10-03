import React, { useState } from 'react'
import { collection, query, where, addDoc, setDoc, getDocs, DocumentReference } from "firebase/firestore"
import { db } from './firebase'
import './TxExplorer.css'

enum TxStatus {
  NotFound = 'N',
  Unconfirmed = 'U',
  Confirmed = 'C'
}

type TxData = {
  txid: string
  status: TxStatus
  timestamp: number
  tx?: any
  segwit?: boolean
  satPerByte?: number
  satPerVByte?: number
}

const TxExplorer = () => {
  // const [txid, setTxid] = useState('F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16')
  const [txid, setTxid] = useState('6eeee319402dd7693434f005189085264a88b139964ddede641b384e08220f84')
  const [txData, setTxData] = useState<TxData | null>(null)
  const [firebaseId, setFirebaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const getStatus = () => {
    setTxData(null)
    if (!txid) { setStatusMessage('Txid should not be empty'); return }
    if (txid.length !== 64) { setStatusMessage('Txid should be 64 characters long'); return }

    const URL = `https://mempool.space/api/tx/${txid}`
    setLoading(true)
    setStatusMessage('Loading...')
    setFirebaseId(null)
    console.log(`Fetching ${URL}`)

    const txData: TxData = {
      txid: txid,
      status: TxStatus.NotFound,
      timestamp: Date.now(),
    }

    fetch(URL)
      .then(async response => {
        if (response.ok) {
          return response.json()
        } else if (response.status === 404) {
          await storeTx(txData);
          setTxData(txData);
          throw new Error('Transaction not found')
        } else {
          throw new Error(await response.text())
        }
      })
      .then(async data => {
        processTx(data, txData)
        await storeTx(txData);
        setTxData(txData)
        setStatusMessage(null)
      })
      .catch(e => setStatusMessage(e.message))
      .finally(() => { setLoading(false) })
  }

  const processTx = (tx: any, txData: TxData) => {
    console.log('Processing:', tx)
    txData.tx = tx
    txData.segwit = true  // TODO: how to determine if it's a segwit transaction?
    txData.status = tx.status.confirmed ? TxStatus.Confirmed : TxStatus.Unconfirmed // TODO: if confirmed, how to retrieve latest block to count confirmations?
    if (txData.segwit) {
      txData.satPerVByte = tx.fee / (tx.weight / 4)  // Source: https://en.bitcoin.it/wiki/Satoshi_per_byte
    } else {
      txData.satPerByte = tx.fee / tx.size
    }
  }

  const storeTx = async (txData: TxData) => {
    console.log('Storing:', txData)
    const txRef = collection(db, 'transactions')
    await getDocs(query(txRef, where('txid', '==', txData.txid)))
      .then(async querySnapshot => {
        let docRef: DocumentReference;
        if (querySnapshot.docs.length > 0) {
          docRef = querySnapshot.docs[0].ref;
          await setDoc(docRef, txData);
        } else {
          docRef = await addDoc(txRef, txData)
        }
        console.log('Firebase ID:', docRef.id)
        setFirebaseId(docRef.id)
      })
  }

  return <>
    <div id="tx_input">
      <form onSubmit={getStatus}>
        <input type="text" value={txid} size={72} onChange={e => setTxid(e.target.value.trim())} />&nbsp;
        <button onClick={getStatus} disabled={loading ? true : undefined}>get status</button>
      </form>
      {statusMessage && <p className="status_message">{statusMessage}</p>}
    </div>
    {txData && <TxInfo txData={txData} firebaseId={firebaseId} />}
  </>
}

const TxInfo = ({ txData, firebaseId }) => (
  <div id="tx_data">
    <ul>
      {txData.status !== TxStatus.NotFound && <>
        <li>{txData.status === TxStatus.Confirmed ? 'Confirmed' : 'Unconfirmed'}</li>
        <li>Segwit: {txData.segwit ? 'true' : 'false'} <strong> - Check for Segwit is hardcoded as true</strong></li>
        {txData.satPerByte !== undefined && <li>Sat/Byte: {txData.satPerByte}</li>}
        {txData.satPerVByte !== undefined && <li>Sat/VByte: {txData.satPerVByte}</li>}
      </>}
      <li>Last checked: {new Date(txData.timestamp).toString()}</li>
    </ul>
    <p>
      <a href={`https://mempool.space/tx/${txData.txid}`} target="_blank" rel="noopener noreferrer">compare</a>
      {firebaseId && <> - Firebase ID: {firebaseId}</>}
    </p>
    {txData.tx && <pre>{JSON.stringify(txData.tx, null, 2)}</pre>}
  </div>
)

export default TxExplorer
