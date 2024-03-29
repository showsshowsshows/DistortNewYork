import ShowGrid from '@/components/shows/show-grid'
import ShowDateFilter from '@/components/shows/show-date-filter'
import GenSearch from '@/components/shows/gen-search'
import router from 'next/router'
import Head from 'next/head'
import { fetchAllShows } from '@/helpers/api-util'

function AllShowsPage ({ shows }) {
  function findShowsByDateHandler (year, month) {
    const fullPath = `/shows/${year}/${month}`

    router.push(fullPath)
  }

  function genSearchHandler (query) {
    const fullPath = `/search/${query}`

    router.push(fullPath)
  }

  return (
    <>
      <Head>
        <title>All Events</title>
        <meta
          name='description'
          content='search events in NY'
        />
      </Head>
      <ShowDateFilter onSearch={findShowsByDateHandler} />
      <GenSearch onSearch={genSearchHandler} />
      <ShowGrid items={shows} />
    </>
  )
}

export async function getStaticProps () {
  try {
    const shows = await fetchAllShows()

    return {
      props: {
        shows: JSON.parse(JSON.stringify(shows))
      },
      revalidate: 60
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)

    return {
      props: {
        shows: [],
        error: 'Error in getAllShows'
      },
      revalidate: 60
    }
  }
}
export default AllShowsPage
