import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  try {
    // Get all files in checkins bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from('checkins')
      .list()

    if (listError) {
      throw listError
    }

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find files older than 30 days
    const filesToDelete = files
      .filter(file => new Date(file.created_at) < thirtyDaysAgo)
      .map(file => file.name)

    if (filesToDelete.length === 0) {
      return new Response(JSON.stringify({ message: 'No files to delete' }), {
        status: 200,
      })
    }

    // Delete the old files
    const { error: deleteError } = await supabase
      .storage
      .from('checkins')
      .remove(filesToDelete)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({
        message: `Deleted ${filesToDelete.length} files older than 30 days`,
      }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})