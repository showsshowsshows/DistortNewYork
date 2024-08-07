import { useState, useEffect } from 'react'
import ShowGrid from '@/components/shows/show-grid'
import ShowDateFilter from '@/components/shows/show-date-filter'
import GenSearch from '@/components/shows/gen-search'
import router from 'next/router'
import Head from 'next/head'
import { fetchAllShows } from '@/helpers/api-util'
import Pagination from '@/components/ui/pagination'

function AllShowsPage ({ shows, totalShows, initialPage }) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isBottom, setIsBottom] = useState(false)

  function findShowsByDateHandler (year, month) {
    const fullPath = `/shows/${year}/${month}`

    router.push(fullPath)
  }

  function genSearchHandler (query) {
    const fullPath = `/search/${query}`

    router.push(fullPath)
  }

  function handlePageChange (newPage) {
    setCurrentPage(newPage)
    router.push(`/shows?page=${newPage}`)
  }

  const totalPages = Math.ceil(totalShows / 15)

  useEffect(() => {
    function handleScroll () {
      const bottom =
        Math.ceil(window.innerHeight + window.scrollY) >=
        document.documentElement.scrollHeight
      setIsBottom(bottom)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {}, [isBottom])

  return (
    <>
      <Head>
        <title>All Events</title>
        <meta name='description' content='search events in NY' />
      </Head>
      <ShowDateFilter onSearch={findShowsByDateHandler} />
      <GenSearch onSearch={genSearchHandler} />
      <ShowGrid items={shows} />
      <div className='pagination-wrapper-default'>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          customClass='pagination-wrapper-default'
        />
      </div>
    </>
  )
}

export async function getServerSideProps (context) {
  const page = context.query.page ? parseInt(context.query.page, 15) : 1

  try {
    const { shows, totalShows } = await fetchAllShows(page)

    return {
      props: {
        shows: JSON.parse(JSON.stringify(shows)),
        totalShows,
        initialPage: page
      }
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)

    return {
      props: {
        shows: [],
        totalShows: 0,
        initialPage: 1,
        error: 'Error in getAllShows'
      }
    }
  }
}

export default AllShowsPage
