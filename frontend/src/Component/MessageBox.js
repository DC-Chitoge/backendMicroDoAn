import Alert from 'react-bootstrap/Alert';

export default function MessageBox(props) {
  // thong bao truyen variant neu ton tai bang props hoac thong tin thong bao sang HomeSreen
  return <Alert variant={props.variant || 'info'}>{props.children}</Alert>;
}
