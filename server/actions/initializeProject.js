import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {LGBadRequestError} from 'src/server/util/error'

export default async function initializeProject(project) {
  const {Project} = require('src/server/services/dataService')

  project = typeof project === 'string' ? await Project.get(project) : project
  if (!project) {
    throw new LGBadRequestError(`Project ${project} not found; initialization aborted`)
  }

  console.log(`Initializing project #${project.name}`)

  return _initializeProjectGoalChannel(project)
}

async function _initializeProjectGoalChannel(project) {
  const chatService = require('src/server/services/chatService')

  const {goal} = project
  const players = await getPlayerInfo(project.playerIds)
  const playerHandles = players.map(p => p.handle)

  await chatService.sendDirectMessage(playerHandles, _welcomeMessage(project, goal, players))

  const goalChannelName = String(goal.number)
  try {
    await chatService.createChannel(goalChannelName)
    try {
      await _setupNewChannel(goalChannelName, goal.url, playerHandles)
    } catch (err) {
      if (_isNotFoundError(err)) {
        await new Promise(resolve => {
          setTimeout(async () => {
            await _setupNewChannel(goalChannelName, goal.url, playerHandles)
            resolve()
          }, 1000) // try again in 1 second
        })
      }
    }
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      await chatService.inviteToChannel(goalChannelName, playerHandles)
    } else {
      throw err
    }
  }
}

async function _setupNewChannel(channelName, channelTopic, userHandles) {
  const chatService = require('src/server/services/chatService')

  await chatService.setChannelTopic(channelName, channelTopic)
  await chatService.inviteToChannel(channelName, userHandles)
}

function _isDuplicateChannelError(error) {
  return (error.message || '').includes('name_taken')
}

function _isNotFoundError(error) {
  return (error.message || '').includes('channel_not_found')
}

function _welcomeMessage(project, goal, players) {
  const goalLink = `<${goal.url}|${goal.number}: ${goal.title}>`
  return `
🎊 *Welcome to the ${project.name} project!* 🎊

*Your goal is:* ${goalLink}

*Your team is:*
${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

>The first step is to create an appropriate project artifact.
>Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.`
}
