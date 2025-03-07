import React from 'react'
import Stats from '../dashboardComponents/maindetails'
import Sidebar from '../dashboardComponents/sidebar'

const AdminDashboard = () => {
  return (
    <div className='flex flex-col md:flex-row min-h-screen pt-16'>
      <Sidebar/>
      <div className='flex-1 p-4 md:p-6 lg:p-8 overflow-auto'>
        <Stats/>
      </div>
    </div>
  )
}

export default AdminDashboard;
