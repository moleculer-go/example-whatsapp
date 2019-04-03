import Link from "next/link";
import { MDBBtn } from "mdbreact";

function Panel() {
  return (
    <div>
      You Need to Login first !
      <br />
      <Link href="/generateCode">
        <MDBBtn>Login</MDBBtn>
      </Link>
    </div>
  );
}
export default Panel;
