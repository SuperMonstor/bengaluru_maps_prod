/**
 * Script to check the current Supabase database schema
 * This helps us understand what columns already exist before making changes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('=== Checking Supabase Database Schema ===\n')

  // Check maps table structure
  console.log('📊 MAPS TABLE')
  console.log('─'.repeat(50))
  const { data: mapsData, error: mapsError } = await supabase
    .from('maps')
    .select('*')
    .limit(1)

  if (mapsError) {
    console.error('Error querying maps:', mapsError.message)
  } else if (mapsData && mapsData.length > 0) {
    console.log('Columns:', Object.keys(mapsData[0]).join(', '))
    console.log('Sample row:', JSON.stringify(mapsData[0], null, 2))
  } else {
    console.log('No data in maps table')
  }
  console.log()

  // Check locations table structure
  console.log('📍 LOCATIONS TABLE')
  console.log('─'.repeat(50))
  const { data: locationsData, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .limit(1)

  if (locationsError) {
    console.error('Error querying locations:', locationsError.message)
  } else if (locationsData && locationsData.length > 0) {
    console.log('Columns:', Object.keys(locationsData[0]).join(', '))
    console.log('Sample row:', JSON.stringify(locationsData[0], null, 2))
  } else {
    console.log('No data in locations table')
  }
  console.log()

  // Check users table structure
  console.log('👤 USERS TABLE')
  console.log('─'.repeat(50))
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (usersError) {
    console.error('Error querying users:', usersError.message)
  } else if (usersData && usersData.length > 0) {
    console.log('Columns:', Object.keys(usersData[0]).join(', '))
    console.log('Sample row:', JSON.stringify(usersData[0], null, 2))
  } else {
    console.log('No data in users table')
  }
  console.log()

  // Check votes table structure
  console.log('⬆️  VOTES TABLE')
  console.log('─'.repeat(50))
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('*')
    .limit(1)

  if (votesError) {
    console.error('Error querying votes:', votesError.message)
  } else if (votesData && votesData.length > 0) {
    console.log('Columns:', Object.keys(votesData[0]).join(', '))
    console.log('Sample row:', JSON.stringify(votesData[0], null, 2))
  } else {
    console.log('No data in votes table')
  }
  console.log()

  // Check table counts
  console.log('📈 TABLE COUNTS')
  console.log('─'.repeat(50))

  const { count: mapsCount } = await supabase
    .from('maps')
    .select('*', { count: 'exact', head: true })
  console.log(`Maps: ${mapsCount}`)

  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  console.log(`Locations: ${locationsCount}`)

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  console.log(`Users: ${usersCount}`)

  const { count: votesCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
  console.log(`Votes: ${votesCount}`)
  console.log()

  console.log('✅ Schema check complete!')
}

checkSchema().catch(console.error)
