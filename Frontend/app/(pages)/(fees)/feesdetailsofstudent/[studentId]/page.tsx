// Re-export the existing Fees Collection page component so it can be accessed via
// the dynamic route `/feesdetailsofstudent/[studentId]`.
// This enables navigation from the Collect Fees page which currently pushes to
// `/feesdetailsofstudent/<studentId>?data=...`.

import FeesCollectionPage from "../page";

export default FeesCollectionPage;
