// Debug script for Git status tool
import simpleGit from 'simple-git';

const REPO_PATH = '/Users/rupindersingh/code/encryptdecrypt2';
const git = simpleGit(REPO_PATH);

async function debugGitStatus() {
  console.log('🔍 Debugging Git Status Tool...\n');

  try {
    console.log('📂 Repository path:', REPO_PATH);
    console.log('🔧 Testing simple-git status...');

    const status = await git.status();
    console.log('📊 Raw status result:');
    console.log(JSON.stringify(status, null, 2));

    console.log('\n✅ Git status successful');
    console.log('Current branch:', status.current);
    console.log('Is detached:', status.detached);

  } catch (error) {
    console.error('❌ Git status error:', error.message);
    console.error('Error details:', error);
  }
}

debugGitStatus();