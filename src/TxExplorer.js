import { useState } from 'react'
import './TxExplorer.css'

const TxStatus = {  // TODO: use typescript enum
  NotFound: 'N',
  Unconfirmed: 'U',
  Confirmed: 'C'
}

const TxExplorer = () => {
  // const [txid, setTxid] = useState('F4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16')
  const [txid, setTxid] = useState('6eeee319402dd7693434f005189085264a88b139964ddede641b384e08220f84')
  const [txData, setTxData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const getStatus = () => {
    setTxData(null)
    if (!txid) { setStatusMessage('Txid should not be empty'); return }
    if (txid.length !== 64) { setStatusMessage('Txid should be 64 characters long'); return }

    const URL = `https://mempool.space/api/tx/${txid}`
    setLoading(true)
    setStatusMessage('Loading...')
    console.log(`Fetching ${URL}`)

    const txData = {  // TODO: use typescript
      txid: txid,
      tx: null,
      status: TxStatus.NotFound,
      timestamp: Date.now(),
    }

    fetch(URL)
      .then(async response => {
        if (response.ok) {
          return response.json()
        } else if (response.status === 404) {
          storeTx(txData);
          setTxData(txData);
          throw new Error('Transaction not found')
        } else {
          throw new Error(await response.text())
        }
      })
      .then(data => {
        processTx(data, txData)
        storeTx(txData);
        setTxData(txData)
        setStatusMessage(null)
      })
      .catch(e => setStatusMessage(e.message))
      .finally(() => { setLoading(false) })
  }

  const processTx = (tx, txData) => {
    console.log('Processing:', tx)
    txData.tx = tx;
    txData.segwit = true;  // TODO: how to determine if it's a segwit transaction?
    txData.status = tx.status.confirmed ? TxStatus.Confirmed : TxStatus.Unconfirmed; // TODO: if confirmed, how to retrieve latest block to count confirmations?

    if (txData.isSegwit) {
      txData.satPerVByte = tx.fee / (tx.weight / 4)  // Source: https://en.bitcoin.it/wiki/Satoshi_per_byte
    } else {
      txData.satPerByte = tx.fee / tx.size
    }
    console.log('Processed:', txData)
    return txData
  }

  return <>
    <div id="tx_input">
      <form onSubmit={getStatus}>
        <input type="text" value={txid} size="68" onChange={e => setTxid(e.target.value.trim())} />&nbsp;
        <button onClick={getStatus} disabled={loading ? true : null}>get status</button>
      </form>
      {statusMessage && <p className="status_message">{statusMessage}</p>}
    </div>
    {txData && <TxInfo txData={txData} />}
  </>
}

const TxInfo = ({ txData }) => (
  <div id="tx_data">
    <ul>
      {txData.status != TxStatus.NotFound && <>
        <li>{txData.status == TxStatus.Confirmed ? 'Confirmed' : 'Unconfirmed'}</li>
        <li>Segwit: {txData.segwit ? 'true' : 'false'} <strong> - Check for Segwit is hardcoded as true</strong></li>
        {txData.satPerByte !== undefined && <li>Sat/Byte: {txData.satPerByte}</li>}
        {txData.satPerVByte !== undefined && <li>Sat/VByte: {txData.satPerVByte}</li>}
      </>}
      <li>Last checked: {new Date(txData.timestamp).toString()}</li>
    </ul>
    <p>
      <a href={`https://mempool.space/tx/${txData.txid}`} target="_blank" rel="noopener noreferrer">compare</a>
    </p>
    {txData.tx && <pre>{JSON.stringify(txData.tx, null, 2)}</pre>}
  </div>
)

const storeTx = (txData) => {
  console.log('TODO Storing in firestore', txData)
  // TODO: implement
}

export default TxExplorer
