namespace SEAL.NET.Models.Enums
{
    /// <summary>
    /// A user's self-declared developer profile role. This is purely descriptive
    /// profile metadata and is NOT an authentication/authorization role — it has
    /// nothing to do with Identity roles (Admin, Judge, TeamLeader, Member).
    /// </summary>
    public enum DeveloperRole
    {
        Backend = 0,
        Frontend = 1,
        Fullstack = 2
    }
}
