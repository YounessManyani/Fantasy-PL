const Fixtures = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fixture Analysis</h1>
          <p className="text-gray-600">Analyze fixture difficulty and plan ahead</p>
        </div>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option>GW 1</option>
          <option>GW 2</option>
          <option>GW 3</option>
        </select>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Fixture analysis content coming soon...</p>
      </div>
    </div>
  );
};

export default Fixtures;