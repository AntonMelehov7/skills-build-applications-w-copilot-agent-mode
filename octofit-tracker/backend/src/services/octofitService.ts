import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Activity payload must be an object'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('userId must be a valid ObjectId'), { status: 400 });
  }
  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('teamId must be a valid ObjectId'), { status: 400 });
  }

  const normalizedType = typeof type === 'string' ? type.trim() : '';
  if (!normalizedType) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  const minutesValue = Number(minutes);
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: normalizedType,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Team payload must be an object'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedMascot = typeof mascot === 'string' ? mascot.trim() : '';

  if (!normalizedName) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }
  if (!normalizedMascot) {
    throw Object.assign(new Error('mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members) ? members : [];
  if (!memberIds.every((memberId) => typeof memberId === 'string' && mongoose.Types.ObjectId.isValid(memberId))) {
    throw Object.assign(new Error('members must be valid ObjectId strings'), { status: 400 });
  }

  const existingUserIds = new Set((await User.find({ _id: { $in: memberIds } }).select('_id').lean()).map((user) => user._id.toString()));
  const missingUserIds = memberIds.filter((memberId) => !existingUserIds.has(memberId));
  if (missingUserIds.length > 0) {
    throw Object.assign(new Error('One or more team members do not exist'), { status: 400 });
  }

  const team = await Team.create({
    name: normalizedName,
    mascot: normalizedMascot,
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    {
      $unwind: '$team',
    },
    {
      $project: {
        _id: 0,
        teamId: '$_id',
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
  ]);

  return leaderboard.map((entry, index) => ({
    teamId: entry.teamId,
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const latestActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = typeof latestActivity?.type === 'string' ? latestActivity.type : (typeof user.fitnessGoal === 'string' ? user.fitnessGoal : 'endurance');
  const focus = user.fitnessGoal === 'strength' ? 'strength' : 'endurance';

  const workouts = await Workout.find({ focus }).lean();

  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your ${activityType} activity pattern and ${focus} focus.`,
  }));
}

export { User };
