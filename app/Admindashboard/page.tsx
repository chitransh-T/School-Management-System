import React from 'react'
import Stats from '../dashboardComponents/maindetails'
import Sidebar from '../dashboardComponents/sidebar'
const page = () => {
  return (
    <div className='flex'>
      <Sidebar/>
      <Stats/>
    </div>
  )
}

export default page
