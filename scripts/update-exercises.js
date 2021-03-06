const cp = require('child_process')
const {username} = require('os').userInfo()

const execSync = (...args) =>
  cp
    .execSync(...args)
    .toString()
    .trim()

const branch = execSync('git rev-parse --abbrev-ref HEAD')
if (branch === 'master' && username === 'kentcdodds') {
  updateExercises()
} else {
  console.log(
    `The branch ${branch} is not "master" or the username ${username} is not kentcdodds. So skipping post-commit hook.`,
  )
}

function updateExercises() {
  console.log('Updating exercise branches')
  const branches = execSync(
    `git for-each-ref --format='%(refname:short)'`,
  ).split('\n')
  const exerciseBranches = branches.filter(b => b.startsWith('exercises/'))
  exerciseBranches.forEach(branch => {
    const didUpdate = updateExerciseBranch(branch)
    console.log(`${branch} is up to date.`)
    if (didUpdate) {
      console.log(`Force pushing ${branch}`)
      execSync('git push -f')
    }
  })
  execSync('git checkout master')
  console.log('All exercises up to date.')
}

function updateExerciseBranch(branch) {
  execSync(`git checkout ${branch}`)
  const result = execSync(`git rebase master`)
  const resultLines = result.split('\n')
  const lastLine = resultLines.slice(-1)[0]
  if (result.endsWith(`${branch} is up to date.`)) {
    return false
  } else if (result.endsWith(`Fast-forwarded ${branch} to master.`)) {
    return true
  } else if (lastLine.startsWith('Applying:')) {
    return true
  } else if (result.includes('CONFLICT')) {
    console.error(
      'Merge conflict. Fix the conflict, then run the update-exercises script again to be sure you have everything up to date.',
    )
    throw new Error(result)
  } else {
    console.error(
      'Unhandled result output. Please review and add a handler for it.',
    )
    throw new Error(result)
  }
}
